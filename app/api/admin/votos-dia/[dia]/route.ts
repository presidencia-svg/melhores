import { NextResponse } from "next/server";
import { getAdminTenantOuNull } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const DIA_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dia: string }> }
) {
  const tenant = await getAdminTenantOuNull();
  if (!tenant) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { dia } = await params;
  if (!DIA_RE.test(dia)) {
    return NextResponse.json({ error: "Dia inválido" }, { status: 400 });
  }
  const supabase = createSupabaseAdminClient();
  // Migration 059: RPC agora exige p_tenant_id pra scopar agregacao.
  const { data, error } = await supabase.rpc("votos_por_dia_detalhe", {
    p_dia: dia,
    p_tenant_id: tenant.id,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
