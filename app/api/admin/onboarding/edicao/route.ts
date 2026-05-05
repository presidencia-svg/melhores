import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getAdminTenantOuNull } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({
  ano: z.number().int().min(2024).max(2100),
  nome: z.string().trim().min(3).max(120),
  inicio_votacao: z.string().datetime(),
  fim_votacao: z.string().datetime(),
});

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const tenant = await getAdminTenantOuNull();
  if (!tenant) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const inicio = new Date(parsed.data.inicio_votacao).getTime();
  const fim = new Date(parsed.data.fim_votacao).getTime();
  if (fim <= inicio) {
    return NextResponse.json(
      { error: "Fim da votação precisa ser depois do início" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();

  // Cada tenant tem unique(tenant_id, ano) — bloqueia duplicar.
  const { data: existente } = await supabase
    .from("edicao")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("ano", parsed.data.ano)
    .maybeSingle();
  if (existente) {
    return NextResponse.json(
      { error: `Você já tem uma edição ${parsed.data.ano}` },
      { status: 409 }
    );
  }

  // Desativa edicoes antigas do mesmo tenant antes de criar a nova ativa.
  await supabase
    .from("edicao")
    .update({ ativa: false })
    .eq("tenant_id", tenant.id);

  const { data: edicao, error } = await supabase
    .from("edicao")
    .insert({
      tenant_id: tenant.id,
      ano: parsed.data.ano,
      nome: parsed.data.nome,
      inicio_votacao: parsed.data.inicio_votacao,
      fim_votacao: parsed.data.fim_votacao,
      ativa: true,
    })
    .select("id, ano, nome")
    .single();

  if (error || !edicao) {
    return NextResponse.json(
      { error: `Falha ao criar edição: ${error?.message ?? "?"}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, edicao });
}
