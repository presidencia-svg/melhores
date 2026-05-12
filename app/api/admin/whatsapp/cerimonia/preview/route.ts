import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";

// Lista votantes elegiveis pro aviso de cerimonia: WhatsApp validado, ja
// votaram em algum campeao (top1 ou co-campeao em empate) e ainda nao
// receberam essa mensagem. Limite p_por_campeao define quantos votantes
// por campeao entram (depois dedup) — default 10 (~1050 com 105 categs).
export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const porCampeaoRaw = url.searchParams.get("por_campeao");
  const porCampeao = porCampeaoRaw ? parseInt(porCampeaoRaw, 10) : 10;
  if (!Number.isFinite(porCampeao) || porCampeao < 1 || porCampeao > 100) {
    return NextResponse.json(
      { error: "por_campeao deve ser entre 1 e 100" },
      { status: 400 }
    );
  }

  const tenant = await getCurrentTenant();
  const edicaoStatus = await getEdicaoStatus(tenant.id);
  if (edicaoStatus.status === "sem_edicao") {
    return NextResponse.json({ ok: true, elegiveis: [] });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("elegiveis_cerimonia", {
    p_edicao_id: edicaoStatus.edicao.id,
    p_por_campeao: porCampeao,
  });

  if (error) {
    return NextResponse.json(
      { error: `Falha ao listar elegiveis: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, elegiveis: data ?? [] });
}
