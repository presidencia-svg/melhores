import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminTenantOuNull } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { normalizarNome, nomeCandidatoValido, tituloPT } from "@/lib/utils";

// Checa se o candidato pertence ao tenant do admin logado. Retorna o
// edicao_id se OK, ou null. Usado pra impedir admin do tenant A de
// editar/deletar/mover candidatos de tenants alheios via UUID guess.
async function candidatoPertenceAoTenant(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  candidatoId: string,
  tenantId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("candidatos")
    .select("edicao_id, edicao!inner(tenant_id)")
    .eq("id", candidatoId)
    .eq("edicao.tenant_id", tenantId)
    .maybeSingle();
  return data?.edicao_id ?? null;
}

const PatchBody = z.object({
  nome: z.string().min(2).max(120).optional(),
  descricao: z.string().max(280).nullable().optional(),
  foto_url: z.string().url().nullable().optional(),
  status: z.enum(["aprovado", "rejeitado", "pendente", "duplicado"]).optional(),
  subcategoria_id: z.string().uuid().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenant = await getAdminTenantOuNull();
  if (!tenant) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const json = await req.json().catch(() => ({}));
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const supabaseScope = createSupabaseAdminClient();
  const edicaoCand = await candidatoPertenceAoTenant(supabaseScope, id, tenant.id);
  if (!edicaoCand) {
    return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });
  }

  // Se o admin esta tentando MOVER pra subcategoria, valida que a
  // subcategoria destino tambem e' do mesmo tenant (mesma edicao).
  if (parsed.data.subcategoria_id) {
    const { data: sub } = await supabaseScope
      .from("subcategorias")
      .select("edicao_id")
      .eq("id", parsed.data.subcategoria_id)
      .maybeSingle();
    if (!sub || sub.edicao_id !== edicaoCand) {
      return NextResponse.json({ error: "Subcategoria inválida" }, { status: 400 });
    }
  }

  if (parsed.data.nome) {
    const validacao = nomeCandidatoValido(parsed.data.nome);
    if (!validacao.ok) {
      return NextResponse.json({ error: validacao.motivo }, { status: 400 });
    }
  }

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.nome) {
    const nomeFormatado = tituloPT(parsed.data.nome);
    update.nome = nomeFormatado;
    update.nome_normalizado = normalizarNome(nomeFormatado);
  }

  const supabase = supabaseScope;

  // Se mudando nome, status pra aprovado, ou subcategoria — checa duplicata
  // dentro da subcategoria final
  const precisaCheck =
    parsed.data.nome !== undefined ||
    parsed.data.subcategoria_id !== undefined ||
    parsed.data.status === "aprovado";
  if (precisaCheck) {
    const { data: atual } = await supabase
      .from("candidatos")
      .select("id, nome_normalizado, subcategoria_id, status")
      .eq("id", id)
      .maybeSingle();
    if (atual) {
      const nomeFinal = (update.nome_normalizado as string | undefined) ?? atual.nome_normalizado;
      const subFinal = (parsed.data.subcategoria_id ?? atual.subcategoria_id) as string;
      const statusFinal = (parsed.data.status ?? atual.status) as string;
      if (statusFinal === "aprovado") {
        const { data: dup } = await supabase
          .from("candidatos")
          .select("id, nome")
          .eq("subcategoria_id", subFinal)
          .eq("nome_normalizado", nomeFinal)
          .eq("status", "aprovado")
          .neq("id", id)
          .maybeSingle();
        if (dup) {
          return NextResponse.json(
            { error: `Já existe candidato "${dup.nome}" nessa subcategoria` },
            { status: 409 }
          );
        }
      }
    }
  }

  const { error } = await supabase.from("candidatos").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenant = await getAdminTenantOuNull();
  if (!tenant) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const edicaoCand = await candidatoPertenceAoTenant(supabase, id, tenant.id);
  if (!edicaoCand) {
    return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });
  }

  const { error } = await supabase.from("candidatos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
