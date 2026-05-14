import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getAdminTenantOuNull } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({
  codigo: z.string().trim().min(3).max(40),
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
    return NextResponse.json(
      { error: "Código inválido — só letras, números e hífen" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("resgatar_cupom", {
    p_codigo: parsed.data.codigo,
    p_tenant_id: tenant.id,
  });

  if (error) {
    console.error("[admin/cupons/resgatar] RPC falhou:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const row = (data as Array<{
    ok: boolean;
    motivo_falha: string | null;
    valor_creditado_centavos: number;
    saldo_atual: number;
  }>)?.[0];

  if (!row?.ok) {
    return NextResponse.json(
      { error: row?.motivo_falha ?? "Falha ao resgatar" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    valor_creditado_centavos: row.valor_creditado_centavos,
    saldo_atual: row.saldo_atual,
  });
}
