import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";

// Stats agregadas pra exibir antes do botao de disparo no admin/whatsapp.
// Computa inline (2 queries) — volume baixo, nao precisa view dedicada.
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
    return NextResponse.json({
      ok: true,
      total: 0,
      ja_receberam: 0,
      na_fila: 0,
      enviadas_hoje: 0,
      ultima_enviada: null,
    });
  }

  const supabase = createSupabaseAdminClient();
  const edicaoId = edicaoStatus.edicao.id;

  // Inicio do dia em America/Sao_Paulo pra "enviadas_hoje".
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  // Sao_Paulo eh UTC-3 (sem DST desde 2019) — subtrai 3h pra pegar boundary
  const inicioDiaUtc = new Date(hoje.getTime() + 3 * 60 * 60 * 1000).toISOString();

  const [{ data: elegRows, error: elegErr }, jaReceberamRes, enviadasHojeRes, ultimaRes] =
    await Promise.all([
      supabase.rpc("elegiveis_cerimonia", {
        p_edicao_id: edicaoId,
        p_por_campeao: porCampeao,
      }),
      supabase
        .from("votantes")
        .select("id", { head: true, count: "exact" })
        .eq("edicao_id", edicaoId)
        .eq("whatsapp_validado", true)
        .not("cerimonia_enviada_em", "is", null),
      supabase
        .from("votantes")
        .select("id", { head: true, count: "exact" })
        .eq("edicao_id", edicaoId)
        .gte("cerimonia_enviada_em", inicioDiaUtc),
      supabase
        .from("votantes")
        .select("cerimonia_enviada_em")
        .eq("edicao_id", edicaoId)
        .not("cerimonia_enviada_em", "is", null)
        .order("cerimonia_enviada_em", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (elegErr) {
    return NextResponse.json(
      { error: `Falha stats: ${elegErr.message}` },
      { status: 500 }
    );
  }

  const naFila = (elegRows ?? []).length;
  const jaReceberam = jaReceberamRes.count ?? 0;

  return NextResponse.json({
    ok: true,
    total: naFila + jaReceberam,
    ja_receberam: jaReceberam,
    na_fila: naFila,
    enviadas_hoje: enviadasHojeRes.count ?? 0,
    ultima_enviada: ultimaRes.data?.cerimonia_enviada_em ?? null,
  });
}
