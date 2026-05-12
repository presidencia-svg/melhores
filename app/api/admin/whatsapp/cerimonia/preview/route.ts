import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";

// Lista votantes elegiveis pro aviso de cerimonia: WhatsApp validado, ja
// votaram em algum campeao (top1 ou co-campeao em empate) e ainda nao
// receberam essa mensagem.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenant = await getCurrentTenant();
  const edicaoStatus = await getEdicaoStatus(tenant.id);
  if (edicaoStatus.status === "sem_edicao") {
    return NextResponse.json({ ok: true, elegiveis: [] });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("elegiveis_cerimonia", {
    p_edicao_id: edicaoStatus.edicao.id,
  });

  if (error) {
    return NextResponse.json(
      { error: `Falha ao listar elegiveis: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, elegiveis: data ?? [] });
}
