import { NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin } from "@/lib/super-admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({
  tenant_id: z.string().uuid(),
  // Confirmacao: usuario digita o slug do tenant pra evitar acidente
  confirmacao_slug: z.string().min(1),
});

export async function POST(req: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Confere se o slug bate antes de chamar a RPC.
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, slug, nome")
    .eq("id", parsed.data.tenant_id)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
  }

  if (tenant.slug !== parsed.data.confirmacao_slug.trim()) {
    return NextResponse.json(
      { error: `Slug não bate. Pra confirmar, digite exatamente: ${tenant.slug}` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.rpc("deletar_tenant_completo", {
    p_tenant_id: parsed.data.tenant_id,
  });

  if (error) {
    console.error("[super/deletar-tenant] RPC falhou:", error);
    return NextResponse.json(
      { error: `Falha ao deletar: ${error.message}` },
      { status: 500 }
    );
  }

  const row = (data as Array<{
    ok: boolean;
    detalhe: string;
    votos_apagados: number;
    votantes_apagados: number;
    candidatos_apagados: number;
    edicoes_apagadas: number;
  }>)?.[0];

  if (!row?.ok) {
    return NextResponse.json(
      { error: row?.detalhe ?? "Falha desconhecida" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    tenant_nome: tenant.nome,
    apagados: {
      votos: row.votos_apagados,
      votantes: row.votantes_apagados,
      candidatos: row.candidatos_apagados,
      edicoes: row.edicoes_apagadas,
    },
  });
}
