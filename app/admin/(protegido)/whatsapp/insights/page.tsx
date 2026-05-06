import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { fetchMetaInsights } from "@/lib/meta-whatsapp/insights";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";
import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  Gauge,
  MessageSquare,
  Send,
  Smartphone,
  TrendingUp,
  Trophy,
  Users,
  Vote,
  XCircle,
  Zap,
} from "lucide-react";

const PERIODOS = [7, 14, 30, 60, 90] as const;

const QUALITY_BG: Record<string, string> = {
  GREEN: "bg-emerald-100 text-emerald-800 border-emerald-200",
  YELLOW: "bg-amber-100 text-amber-800 border-amber-200",
  RED: "bg-rose-100 text-rose-800 border-rose-200",
};

const CATEGORY_LABEL: Record<string, string> = {
  AUTHENTICATION: "Autenticação (OTP)",
  UTILITY: "Utilidade",
  MARKETING: "Marketing",
  SERVICE: "Atendimento",
  UNKNOWN: "—",
};

const CANAL_LABEL: Record<string, string> = {
  meta: "Meta API",
  zapi: "Z-API",
  sms: "SMS (Zenvia)",
  desconhecido: "—",
};

const MOTIVO_LABEL: Record<string, string> = {
  manual: "Manual",
  auto_empate: "Auto (empate)",
};

const ORIGEM_LABEL: Record<string, string> = {
  ios: "iPhone/iPad",
  android: "Android",
  mac: "Mac",
  windows: "Windows",
  linux: "Linux",
  outro: "Outro",
  desconhecido: "Não informado",
};

const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function pct(num: number, den: number): number {
  return den > 0 ? (num / den) * 100 : 0;
}

// Meta cobra a maioria dos WABAs em USD. Se sua conta for BRL, troca via
// env var META_CURRENCY=BRL.
const META_CURRENCY = process.env.META_CURRENCY || "USD";

function formatMoney(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: META_CURRENCY,
  }).format(v);
}

// Custo Meta filtrado por categoria — pra ROI ficar comparavel:
// AUTHENTICATION (OTP) nao deveria contar em custo de marketing/parcial.
function custoMarketing(meta: { conversations: { by_category: { category: string; cost: number }[] } }): number {
  return meta.conversations.by_category
    .filter((c) => c.category === "MARKETING")
    .reduce((a, c) => a + c.cost, 0);
}

function clampDays(input: string | undefined): number {
  const n = parseInt(input ?? "7", 10);
  if (!Number.isFinite(n)) return 7;
  if (n < 1) return 1;
  if (n > 90) return 90;
  return n;
}

type FunilRow = {
  cadastros: number;
  spc_validados: number;
  wa_validados: number;
  votaram: number;
  completaram: number;
};

type RoiRow = {
  motivo: string;
  canal: string;
  enviados: number;
  converteram: number;
  votos_gerados: number;
};

type HeatmapRow = { dow: number; hora: number; total: number };

type VelocidadeRow = { hora: string; total: number };

type AceleracaoRow = {
  subcategoria_id: string;
  subcategoria_nome: string;
  votos_24h: number;
  votos_24h_antes: number;
  delta: number;
};

type OrigemRow = { origem: string; total: number };

export default async function WhatsAppInsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const sp = await searchParams;
  const days = clampDays(sp.periodo);
  // eslint-disable-next-line react-hooks/purity -- server component, valor deterministico por render
  const nowMs = Date.now();
  const cutoff = new Date(nowMs - days * 86_400_000).toISOString();

  const tenant = await getCurrentTenant();
  const edicaoStatus = await getEdicaoStatus(tenant.id);
  const edicaoId =
    edicaoStatus.status !== "sem_edicao" ? edicaoStatus.edicao.id : "";
  const supabase = createSupabaseAdminClient();

  const [
    metaInsights,
    funilRes,
    roiRes,
    parcialRoiRes,
    heatmapRes,
    velocidadeRes,
    aceleracaoRes,
    origemRes,
    otpResumoRes,
    votosResumoRes,
    votantesPeriodoRes,
    votantesTotalRes,
    validadosTotalRes,
    parciaisRes,
    incentivosRes,
    votosPorDiaRes,
    resultadosRes,
    otpPorDiaRes,
  ] = await Promise.all([
    fetchMetaInsights(days),
    supabase.rpc("insights_funil", { dias: days }),
    supabase.rpc("insights_incentivo_roi", { dias: days }),
    supabase.rpc("insights_parcial_roi", { dias: days }),
    supabase.rpc("insights_votos_heatmap", { dias: Math.min(days, 14) }),
    supabase.from("v_votos_velocidade_48h").select("hora, total"),
    supabase.rpc("insights_subs_aceleracao"),
    supabase.rpc("insights_origem", { dias: days }),
    supabase.rpc("insights_otp_periodo", { dias: days }),
    supabase.rpc("insights_votos_periodo", { dias: days }),
    supabase
      .from("votantes")
      .select("id", { head: true, count: "exact" })
      .eq("edicao_id", edicaoId)
      .gte("criado_em", cutoff),
    supabase
      .from("votantes")
      .select("id", { head: true, count: "exact" })
      .eq("edicao_id", edicaoId),
    supabase
      .from("votantes")
      .select("id", { head: true, count: "exact" })
      .eq("edicao_id", edicaoId)
      .eq("whatsapp_validado", true),
    supabase
      .from("votantes")
      .select("id", { head: true, count: "exact" })
      .eq("edicao_id", edicaoId)
      .not("parcial_enviada_em", "is", null)
      .gte("parcial_enviada_em", cutoff),
    supabase
      .from("votantes")
      .select("id", { head: true, count: "exact" })
      .eq("edicao_id", edicaoId)
      .not("incentivo_enviado_em", "is", null)
      .gte("incentivo_enviado_em", cutoff),
    supabase
      .from("v_votos_por_dia")
      .select("dia, total")
      .eq("edicao_id", edicaoId),
    supabase
      .from("v_resultados")
      .select("subcategoria_id, subcategoria_nome, candidato_nome, total_votos")
      .eq("edicao_id", edicaoId),
    supabase
      .from("v_otp_por_dia")
      .select("dia, total")
      .eq("edicao_id", edicaoId),
  ]);

  const funil = (funilRes.data?.[0] ?? null) as FunilRow | null;
  const roi = (roiRes.data ?? []) as RoiRow[];
  const parcialRoi = (parcialRoiRes.data?.[0] ?? null) as
    | { enviados: number; converteram: number; votos_gerados: number }
    | null;
  const heatmap = (heatmapRes.data ?? []) as HeatmapRow[];
  const velocidade = (velocidadeRes.data ?? []) as VelocidadeRow[];
  const aceleracao = (aceleracaoRes.data ?? []) as AceleracaoRow[];
  const origem = (origemRes.data ?? []) as OrigemRow[];

  const otpResumo = (otpResumoRes.data?.[0] ?? null) as
    | { total: number; validados: number; tentativas_media: number | string }
    | null;
  const otpsTotal = Number(otpResumo?.total ?? 0);
  const otpsValidados = Number(otpResumo?.validados ?? 0);
  const otpsTentativasMedias = Number(otpResumo?.tentativas_media ?? 0);

  const votosResumo = (votosResumoRes.data?.[0] ?? null) as
    | { total: number; votantes_unicos: number }
    | null;
  const votosTotal = Number(votosResumo?.total ?? 0);
  const votantesQueVotaram = Number(votosResumo?.votantes_unicos ?? 0);

  const votantesPeriodo = votantesPeriodoRes.count ?? 0;
  const votantesTotal = votantesTotalRes.count ?? 0;
  const validadosTotal = validadosTotalRes.count ?? 0;
  const parciaisEnviadas = parciaisRes.count ?? 0;
  const incentivosEnviados = incentivosRes.count ?? 0;

  const conversao = pct(votantesQueVotaram, votantesPeriodo);
  const completou = funil ? pct(funil.completaram, funil.cadastros) : 0;

  // Subs acirradas (deriva de v_resultados — ja vem da query existente)
  type Linha = { nome: string; votos: number };
  const bySub: Record<string, { nome: string; cands: Linha[] }> = {};
  for (const r of resultadosRes.data ?? []) {
    const k = r.subcategoria_id as string;
    if (!bySub[k]) bySub[k] = { nome: r.subcategoria_nome as string, cands: [] };
    bySub[k].cands.push({
      nome: r.candidato_nome as string,
      votos: (r.total_votos as number) ?? 0,
    });
  }
  const acirradas = Object.values(bySub)
    .map((s) => {
      const sorted = s.cands.sort((a, b) => b.votos - a.votos);
      if (sorted.length < 2 || sorted[0]!.votos === 0) return null;
      return {
        nome: s.nome,
        primeiro: sorted[0]!,
        segundo: sorted[1]!,
        diff: sorted[0]!.votos - sorted[1]!.votos,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 10);

  // Atividade diaria (votos + OTP por dia) — mantida pra serie historica
  const seriaPorDia: Record<string, { otp: number; votos: number }> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(nowMs - i * 86_400_000).toISOString().slice(0, 10);
    seriaPorDia[d] = { otp: 0, votos: 0 };
  }
  for (const r of votosPorDiaRes.data ?? []) {
    const bucket = seriaPorDia[r.dia as string];
    if (bucket) bucket.votos = r.total as number;
  }
  for (const r of otpPorDiaRes.data ?? []) {
    const bucket = seriaPorDia[r.dia as string];
    if (bucket) bucket.otp = r.total as number;
  }
  const serie = Object.entries(seriaPorDia)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const maxBar = Math.max(1, ...serie.map((s) => Math.max(s.otp, s.votos)));

  const totalSent = metaInsights?.templates.reduce((a, t) => a + t.sent, 0) ?? 0;
  const totalDelivered = metaInsights?.templates.reduce((a, t) => a + t.delivered, 0) ?? 0;
  const totalRead = metaInsights?.templates.reduce((a, t) => a + t.read, 0) ?? 0;

  // Heatmap: matriz 7 dias x 24 horas
  const heatmapMatrix: number[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );
  for (const h of heatmap) {
    if (h.dow >= 0 && h.dow < 7 && h.hora >= 0 && h.hora < 24) {
      heatmapMatrix[h.dow]![h.hora] = h.total;
    }
  }
  const heatmapMax = Math.max(1, ...heatmap.map((h) => h.total));

  // Velocidade max
  const velocidadeMax = Math.max(1, ...velocidade.map((v) => v.total));
  const velocidadeTotal = velocidade.reduce((a, v) => a + v.total, 0);

  // Origem total
  const origemTotal = origem.reduce((a, o) => a + o.total, 0);

  // ROI agregado
  const roiTotalEnviados = roi.reduce((a, r) => a + r.enviados, 0);
  const roiTotalConverteram = roi.reduce((a, r) => a + r.converteram, 0);
  const roiTotalVotos = roi.reduce((a, r) => a + r.votos_gerados, 0);

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-cdl-blue flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-cdl-green" />
            Insights
          </h1>
          <p className="text-muted mt-1">
            Operação interna (Supabase) + entrega via Meta Cloud API
          </p>
        </div>
        <nav className="flex gap-1 bg-cream-100 border border-[rgba(10,42,94,0.15)] rounded-lg p-1">
          {PERIODOS.map((p) => (
            <Link
              key={p}
              href={`/admin/whatsapp/insights?periodo=${p}`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                p === days ? "bg-cdl-blue text-white" : "text-cdl-blue hover:bg-cdl-blue/10"
              }`}
            >
              {p}d
            </Link>
          ))}
        </nav>
      </header>

      {/* KPIs principais */}
      <section className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Kpi
          icon={<Users className="w-4 h-4" />}
          label="Votantes no período"
          value={votantesPeriodo.toLocaleString("pt-BR")}
          sub={`${votantesTotal.toLocaleString("pt-BR")} no total`}
        />
        <Kpi
          icon={<Vote className="w-4 h-4" />}
          label="Votos no período"
          value={votosTotal.toLocaleString("pt-BR")}
          sub={`${votantesQueVotaram} votantes únicos`}
        />
        <Kpi
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          label="Concluíram votação"
          value={`${completou.toFixed(1)}%`}
          sub={`${(funil?.completaram ?? 0).toLocaleString("pt-BR")} votaram em 85+ subs`}
          tone={completou < 30 ? "warn" : "ok"}
        />
        <Kpi
          icon={<TrendingUp className="w-4 h-4 text-cdl-blue" />}
          label="Conversão registro→voto"
          value={`${conversao.toFixed(1)}%`}
          sub={`${votantesQueVotaram}/${votantesPeriodo} no período`}
        />
      </section>

      {/* Funil de conversao */}
      <Card>
        <CardHeader className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-cdl-blue" />
          <h2 className="font-display text-xl font-semibold text-cdl-blue">
            Funil de conversão ({days}d)
          </h2>
          <span className="text-xs text-muted ml-auto">
            cada barra mostra % do passo anterior
          </span>
        </CardHeader>
        <CardContent className="pt-0">
          {funil && funil.cadastros > 0 ? (
            <Funil funil={funil} />
          ) : (
            <p className="text-sm text-muted py-6 text-center">
              Sem cadastros no período.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ROI do incentivo */}
      <Card>
        <CardHeader className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-cdl-blue" />
          <h2 className="font-display text-xl font-semibold text-cdl-blue">
            ROI do incentivo ({days}d)
          </h2>
          <span className="text-xs text-muted ml-auto">
            envios → quantos voltaram a votar em até 24h
          </span>
        </CardHeader>
        <CardContent className="pt-0">
          {roi.length === 0 ? (
            <p className="text-sm text-muted py-6 text-center">
              Sem disparos de incentivo no período.
            </p>
          ) : (
            <>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-4">
                <Kpi
                  icon={<Send className="w-4 h-4" />}
                  label="Disparos"
                  value={roiTotalEnviados.toLocaleString("pt-BR")}
                />
                <Kpi
                  label="Converteram"
                  value={roiTotalConverteram.toLocaleString("pt-BR")}
                  sub={`${pct(roiTotalConverteram, roiTotalEnviados).toFixed(1)}% taxa`}
                  tone={
                    pct(roiTotalConverteram, roiTotalEnviados) >= 15 ? "ok" : "warn"
                  }
                />
                <Kpi
                  icon={<Vote className="w-4 h-4" />}
                  label="Votos gerados"
                  value={roiTotalVotos.toLocaleString("pt-BR")}
                  sub={`${(roiTotalVotos / Math.max(1, roiTotalConverteram)).toFixed(1)} votos/convertido`}
                />
                <Kpi
                  label="Custo por voto"
                  value={
                    metaInsights && roiTotalVotos > 0
                      ? formatMoney(custoMarketing(metaInsights) / roiTotalVotos)
                      : "—"
                  }
                  sub="custo Meta marketing ÷ votos gerados"
                />
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(10,42,94,0.15)] text-left text-xs text-muted uppercase tracking-wide">
                    <th className="py-2 pr-3">Motivo</th>
                    <th className="py-2 pr-3">Canal</th>
                    <th className="py-2 pr-3 text-right">Enviados</th>
                    <th className="py-2 pr-3 text-right">Converteram</th>
                    <th className="py-2 pr-3 text-right">Taxa</th>
                    <th className="py-2 text-right">Votos gerados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(10,42,94,0.06)]">
                  {roi.map((r) => {
                    const taxa = pct(r.converteram, r.enviados);
                    return (
                      <tr key={`${r.motivo}-${r.canal}`}>
                        <td className="py-2 pr-3">{MOTIVO_LABEL[r.motivo] ?? r.motivo}</td>
                        <td className="py-2 pr-3 text-xs">
                          {CANAL_LABEL[r.canal] ?? r.canal}
                        </td>
                        <td className="py-2 pr-3 text-right font-mono">
                          {r.enviados.toLocaleString("pt-BR")}
                        </td>
                        <td className="py-2 pr-3 text-right font-mono">
                          {r.converteram.toLocaleString("pt-BR")}
                        </td>
                        <td
                          className={`py-2 pr-3 text-right font-semibold ${
                            taxa >= 20
                              ? "text-emerald-700"
                              : taxa >= 10
                                ? "text-amber-600"
                                : "text-rose-600"
                          }`}
                        >
                          {taxa.toFixed(1)}%
                        </td>
                        <td className="py-2 text-right font-mono">
                          {r.votos_gerados.toLocaleString("pt-BR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </CardContent>
      </Card>

      {/* ROI da parcial */}
      <Card>
        <CardHeader className="flex items-center gap-2">
          <Send className="w-5 h-5 text-cdl-blue" />
          <h2 className="font-display text-xl font-semibold text-cdl-blue">
            ROI da parcial ({days}d)
          </h2>
          <span className="text-xs text-muted ml-auto">
            envios → quantos voltaram a votar em até 24h
          </span>
        </CardHeader>
        <CardContent className="pt-0">
          {!parcialRoi || parcialRoi.enviados === 0 ? (
            <p className="text-sm text-muted py-6 text-center">
              Sem disparos de parcial no período.
            </p>
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <Kpi
                icon={<Send className="w-4 h-4" />}
                label="Disparos"
                value={parcialRoi.enviados.toLocaleString("pt-BR")}
              />
              <Kpi
                label="Converteram"
                value={parcialRoi.converteram.toLocaleString("pt-BR")}
                sub={`${pct(parcialRoi.converteram, parcialRoi.enviados).toFixed(1)}% taxa`}
                tone={
                  pct(parcialRoi.converteram, parcialRoi.enviados) >= 15 ? "ok" : "warn"
                }
              />
              <Kpi
                icon={<Vote className="w-4 h-4" />}
                label="Votos gerados"
                value={parcialRoi.votos_gerados.toLocaleString("pt-BR")}
                sub={`${(parcialRoi.votos_gerados / Math.max(1, parcialRoi.converteram)).toFixed(1)} votos/convertido`}
              />
              <Kpi
                label="Custo por voto"
                value={
                  metaInsights && parcialRoi.votos_gerados > 0
                    ? formatMoney(
                        custoMarketing(metaInsights) / parcialRoi.votos_gerados
                      )
                    : "—"
                }
                sub="custo Meta marketing ÷ votos gerados"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Velocidade + Subs em aceleracao lado a lado */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-cdl-blue" />
            <h2 className="font-display text-xl font-semibold text-cdl-blue">
              Velocidade (48h)
            </h2>
            <span className="text-xs text-muted ml-auto">
              {velocidadeTotal.toLocaleString("pt-BR")} votos
            </span>
          </CardHeader>
          <CardContent className="pt-0">
            {velocidade.length === 0 ? (
              <p className="text-sm text-muted py-6 text-center">Sem dados.</p>
            ) : (
              <Velocidade rows={velocidade} max={velocidadeMax} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-cdl-blue" />
            <h2 className="font-display text-xl font-semibold text-cdl-blue">
              Subcategorias em aceleração
            </h2>
            <span className="text-xs text-muted ml-auto">24h vs 24h anteriores</span>
          </CardHeader>
          <CardContent className="pt-0">
            {aceleracao.length === 0 ? (
              <p className="text-sm text-muted py-6 text-center">
                Sem votos suficientes nas últimas 48h.
              </p>
            ) : (
              <Aceleracao rows={aceleracao} />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Heatmap + Origem lado a lado */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center gap-2">
            <h2 className="font-display text-xl font-semibold text-cdl-blue">
              Quando a galera vota (heatmap)
            </h2>
            <span className="text-xs text-muted ml-auto">
              últimos {Math.min(days, 14)}d · fuso América/Maceió
            </span>
          </CardHeader>
          <CardContent className="pt-0">
            <Heatmap matrix={heatmapMatrix} max={heatmapMax} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cdl-blue" />
            <h2 className="font-display text-xl font-semibold text-cdl-blue">
              Origem
            </h2>
          </CardHeader>
          <CardContent className="pt-0">
            {origem.length === 0 ? (
              <p className="text-sm text-muted py-6 text-center">Sem dados.</p>
            ) : (
              <div className="space-y-2">
                {origem.map((o) => {
                  const p = pct(o.total, origemTotal);
                  return (
                    <div key={o.origem} className="text-xs">
                      <div className="flex justify-between mb-0.5">
                        <span>{ORIGEM_LABEL[o.origem] ?? o.origem}</span>
                        <span className="font-mono text-muted">
                          {o.total.toLocaleString("pt-BR")} · {p.toFixed(1)}%
                        </span>
                      </div>
                      <div className="bg-cream-200 rounded h-2 overflow-hidden">
                        <div
                          className="bg-cdl-blue h-full"
                          style={{ width: `${p}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Subs acirradas */}
      <Card>
        <CardHeader className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-cdl-blue" />
          <h2 className="font-display text-xl font-semibold text-cdl-blue">
            Subcategorias acirradas
          </h2>
          <span className="text-sm text-muted ml-auto">
            top 10 com menor diferença · candidatas a incentivo
          </span>
        </CardHeader>
        <CardContent className="pt-0">
          {acirradas.length === 0 ? (
            <p className="text-sm text-muted py-6 text-center">
              Sem dados de votação suficientes ainda.
            </p>
          ) : (
            <div className="border-t border-[rgba(10,42,94,0.1)] divide-y divide-[rgba(10,42,94,0.06)]">
              {acirradas.map((a) => (
                <div key={a.nome} className="py-2.5 grid grid-cols-12 gap-2 text-sm items-center">
                  <span className="col-span-5 font-medium text-cdl-blue truncate">{a.nome}</span>
                  <span className="col-span-3 truncate">
                    1º <strong>{a.primeiro.nome}</strong> · {a.primeiro.votos}
                  </span>
                  <span className="col-span-3 truncate text-muted">
                    2º {a.segundo.nome} · {a.segundo.votos}
                  </span>
                  <span
                    className={`col-span-1 text-right font-mono font-semibold ${
                      a.diff <= 5
                        ? "text-rose-600"
                        : a.diff <= 15
                          ? "text-amber-600"
                          : "text-cdl-blue"
                    }`}
                  >
                    {a.diff === 0 ? "=" : `+${a.diff}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operacao WhatsApp (interna) */}
      <section className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Kpi
          label="OTPs solicitados"
          value={otpsTotal.toLocaleString("pt-BR")}
          sub={`${otpsTentativasMedias.toFixed(1)} tentativas/código (média)`}
        />
        <Kpi
          label="OTPs validados"
          value={otpsValidados.toLocaleString("pt-BR")}
          sub={`${pct(otpsValidados, otpsTotal).toFixed(1)}%`}
          tone={pct(otpsValidados, otpsTotal) < 70 ? "warn" : "ok"}
        />
        <Kpi
          icon={<Send className="w-4 h-4" />}
          label="Parciais disparadas"
          value={parciaisEnviadas.toLocaleString("pt-BR")}
          sub="no período"
        />
        <Kpi
          icon={<Send className="w-4 h-4" />}
          label="Incentivos disparados"
          value={incentivosEnviados.toLocaleString("pt-BR")}
          sub="no período"
        />
      </section>

      {/* Atividade diaria */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl font-semibold text-cdl-blue">
            Atividade diária ({days}d)
          </h2>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          <div className="flex gap-4 text-xs text-muted mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-cdl-blue inline-block" /> Votos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> OTPs
            </span>
          </div>
          {serie.map((s) => (
            <div key={s.date} className="grid grid-cols-12 gap-2 items-center text-xs">
              <span className="col-span-2 text-muted font-mono">{s.date.slice(5)}</span>
              <div className="col-span-9 space-y-0.5">
                <div className="bg-cream-200 rounded h-3 overflow-hidden">
                  <div
                    className="bg-cdl-blue h-full"
                    style={{ width: `${(s.votos / maxBar) * 100}%` }}
                  />
                </div>
                <div className="bg-cream-200 rounded h-3 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${(s.otp / maxBar) * 100}%` }}
                  />
                </div>
              </div>
              <span className="col-span-1 text-right font-mono">
                {s.votos}/{s.otp}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Saude da Meta + Performance por template (rodape) */}
      {metaInsights ? (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            {metaInsights.phone_status.map((p) => (
              <Card key={p.id}>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 font-display text-base font-semibold text-cdl-blue">
                    {p.error ? (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    {p.display_phone_number || `ID ${p.id}`}
                    {p.verified_name && (
                      <span className="text-xs font-normal text-muted ml-1">
                        ({p.verified_name})
                      </span>
                    )}
                  </div>
                  {p.error ? (
                    <p className="text-sm text-rose-600">{p.error}</p>
                  ) : (
                    <dl className="text-sm space-y-1">
                      <Row label="Quality Rating">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                            QUALITY_BG[p.quality_rating ?? ""] ??
                            "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {p.quality_rating ?? "—"}
                        </span>
                      </Row>
                      <Row label="Tier de mensagens">{p.messaging_limit_tier ?? "—"}</Row>
                      <Row label="Status do nome">{p.name_status ?? "—"}</Row>
                      <Row label="Throughput">{p.throughput?.level ?? "—"}</Row>
                    </dl>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Kpi label="Enviadas (Meta)" value={totalSent.toLocaleString("pt-BR")} />
            <Kpi
              label="Entregues"
              value={totalDelivered.toLocaleString("pt-BR")}
              sub={`${pct(totalDelivered, totalSent).toFixed(1)}% do enviado`}
              tone={pct(totalDelivered, totalSent) < 90 && totalSent > 0 ? "warn" : "ok"}
            />
            <Kpi
              label="Lidas"
              value={totalRead.toLocaleString("pt-BR")}
              sub={`${pct(totalRead, totalDelivered).toFixed(1)}% do entregue`}
            />
            <Kpi
              label="Conversas Meta"
              value={metaInsights.conversations.total.toLocaleString("pt-BR")}
              sub={`Custo: ${formatMoney(metaInsights.conversations.total_cost)}`}
            />
          </section>

          <Card>
            <CardHeader>
              <h2 className="font-display text-xl font-semibold text-cdl-blue">
                Performance por template
              </h2>
            </CardHeader>
            <CardContent className="pt-0 overflow-x-auto">
              {metaInsights.templates.length === 0 ? (
                <p className="text-sm text-muted py-6 text-center">Sem envios no período.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(10,42,94,0.15)] text-left text-xs text-muted uppercase tracking-wide">
                      <th className="py-2 pr-3">Template</th>
                      <th className="py-2 pr-3">Categoria</th>
                      <th className="py-2 pr-3 text-right">Enviadas</th>
                      <th className="py-2 pr-3 text-right">Entregues</th>
                      <th className="py-2 pr-3 text-right">% Entrega</th>
                      <th className="py-2 pr-3 text-right">Lidas</th>
                      <th className="py-2 text-right">% Leitura</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(10,42,94,0.06)]">
                    {metaInsights.templates.map((t) => {
                      const dr = pct(t.delivered, t.sent);
                      const rr = pct(t.read, t.delivered);
                      return (
                        <tr key={t.template_id}>
                          <td className="py-2 pr-3 font-mono text-xs">{t.name}</td>
                          <td className="py-2 pr-3 text-xs">
                            {CATEGORY_LABEL[t.category] ?? t.category}
                          </td>
                          <td className="py-2 pr-3 text-right">
                            {t.sent.toLocaleString("pt-BR")}
                          </td>
                          <td className="py-2 pr-3 text-right">
                            {t.delivered.toLocaleString("pt-BR")}
                          </td>
                          <td
                            className={`py-2 pr-3 text-right font-semibold ${
                              dr < 90 ? "text-rose-600" : "text-emerald-700"
                            }`}
                          >
                            {dr.toFixed(1)}%
                          </td>
                          <td className="py-2 pr-3 text-right">
                            {t.read.toLocaleString("pt-BR")}
                          </td>
                          <td className="py-2 text-right">{rr.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-display text-xl font-semibold text-cdl-blue">
                Custo Meta por categoria
              </h2>
            </CardHeader>
            <CardContent className="pt-0 overflow-x-auto">
              {metaInsights.conversations.by_category.length === 0 ? (
                <p className="text-sm text-muted py-6 text-center">
                  Sem dados de custo no período.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(10,42,94,0.15)] text-left text-xs text-muted uppercase tracking-wide">
                      <th className="py-2 pr-3">Categoria</th>
                      <th className="py-2 pr-3 text-right">Conversas</th>
                      <th className="py-2 pr-3 text-right">% do total</th>
                      <th className="py-2 pr-3 text-right">Custo total</th>
                      <th className="py-2 text-right">Custo por conversa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(10,42,94,0.06)]">
                    {metaInsights.conversations.by_category.map((c) => {
                      const cpc = c.conversation > 0 ? c.cost / c.conversation : 0;
                      const totalConv = metaInsights.conversations.total;
                      return (
                        <tr key={c.category}>
                          <td className="py-2 pr-3 font-medium">
                            {CATEGORY_LABEL[c.category] ?? c.category}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono">
                            {c.conversation.toLocaleString("pt-BR")}
                          </td>
                          <td className="py-2 pr-3 text-right text-xs text-muted">
                            {pct(c.conversation, totalConv).toFixed(1)}%
                          </td>
                          <td className="py-2 pr-3 text-right font-mono">
                            {formatMoney(c.cost)}
                          </td>
                          <td className="py-2 text-right font-mono">
                            {formatMoney(cpc)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="font-semibold border-t-2 border-[rgba(10,42,94,0.2)]">
                      <td className="py-2 pr-3">Total</td>
                      <td className="py-2 pr-3 text-right font-mono">
                        {metaInsights.conversations.total.toLocaleString("pt-BR")}
                      </td>
                      <td className="py-2 pr-3 text-right text-xs text-muted">100%</td>
                      <td className="py-2 pr-3 text-right font-mono">
                        {formatMoney(metaInsights.conversations.total_cost)}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {formatMoney(
                          metaInsights.conversations.total > 0
                            ? metaInsights.conversations.total_cost /
                                metaInsights.conversations.total
                            : 0
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
              <p className="text-xs text-muted mt-3 leading-relaxed">
                A Meta cobra por conversa de 24h, não por mensagem.{" "}
                <strong>Marketing</strong> é o que paga as parciais e incentivos.{" "}
                <strong>Authentication</strong> cobre OTPs.{" "}
                <strong>Utility</strong> são confirmações pós-cadastro.
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-cdl-blue">
                Métricas da Meta Cloud API não estão disponíveis
              </p>
              <p className="text-muted mt-1">
                Configure no Vercel as env vars{" "}
                <code className="bg-cream-200 px-1 rounded">META_WABA_ID</code>,{" "}
                <code className="bg-cream-200 px-1 rounded">META_WHATSAPP_TOKEN</code> e{" "}
                <code className="bg-cream-200 px-1 rounded">META_WHATSAPP_PHONE_IDS</code> pra
                ver qualidade dos números, performance por template e custo de conversas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validados total — referencia de longo prazo */}
      <section className="grid gap-4 grid-cols-2 md:grid-cols-2">
        <Kpi
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          label="WhatsApps validados (lifetime)"
          value={validadosTotal.toLocaleString("pt-BR")}
          sub={`${pct(validadosTotal, votantesTotal).toFixed(1)}% do total de votantes`}
        />
        <Kpi
          icon={<Vote className="w-4 h-4" />}
          label="Total de votantes (lifetime)"
          value={votantesTotal.toLocaleString("pt-BR")}
        />
      </section>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <h2 className="font-display text-base font-semibold text-cdl-blue">
            Boas práticas pra manter Quality Rating verde
          </h2>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-xs text-muted list-disc pl-5 space-y-1.5">
            <li>
              Quality Rating <strong>vermelho</strong> reduz throughput.{" "}
              <strong>Amarelo</strong> é alerta. <strong>Verde</strong> é o ideal.
            </li>
            <li>Não dispare marketing repetido pro mesmo número em &lt; 24h.</li>
            <li>
              Templates editados entram em <strong>Qualidade pendente</strong> e a Meta
              estrangula entrega até estabilizar (24–72h). Evite editar durante o evento.
            </li>
            <li>Templates com taxa de entrega &lt; 90% indicam problema de qualidade.</li>
            <li>
              Use a categoria certa: <strong>Auth</strong> só pra OTP, <strong>Utility</strong>{" "}
              pra confirmação de transação, <strong>Marketing</strong> pra promoção.
            </li>
            <li>Respeite opt-out — se a pessoa pedir pra parar, registre e não envie mais.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Funil({ funil }: { funil: FunilRow }) {
  const steps = [
    { label: "Cadastros", value: funil.cadastros },
    { label: "SPC validado", value: funil.spc_validados },
    { label: "WhatsApp validado", value: funil.wa_validados },
    { label: "Votaram (≥1 sub)", value: funil.votaram },
    { label: "Votaram em 85+ subs", value: funil.completaram },
  ];
  const max = Math.max(1, funil.cadastros);
  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const prev = i === 0 ? funil.cadastros : steps[i - 1]!.value;
        const taxaPasso = pct(s.value, prev);
        const taxaTopo = pct(s.value, funil.cadastros);
        return (
          <div key={s.label} className="grid grid-cols-12 gap-2 items-center text-sm">
            <span className="col-span-3 text-cdl-blue font-medium">{s.label}</span>
            <div className="col-span-7 bg-cream-200 rounded h-6 overflow-hidden relative">
              <div
                className="bg-cdl-blue h-full flex items-center px-2 text-white text-xs font-mono"
                style={{ width: `${(s.value / max) * 100}%` }}
              >
                {s.value.toLocaleString("pt-BR")}
              </div>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted font-mono">
                {taxaTopo.toFixed(1)}%
              </span>
            </div>
            <span
              className={`col-span-2 text-right text-xs font-mono ${
                i === 0
                  ? "text-muted"
                  : taxaPasso >= 80
                    ? "text-emerald-700"
                    : taxaPasso >= 50
                      ? "text-amber-600"
                      : "text-rose-600"
              }`}
            >
              {i === 0 ? "—" : `${taxaPasso.toFixed(1)}% do passo`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Velocidade({ rows, max }: { rows: VelocidadeRow[]; max: number }) {
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Maceio",
    hour: "2-digit",
    hour12: false,
  });
  const lastIdx = rows.length - 1;
  return (
    <div>
      <div className="flex items-end gap-[2px] h-32">
        {rows.map((r, i) => {
          const h = (r.total / max) * 100;
          return (
            <div
              key={r.hora}
              className="flex-1 bg-cream-200 rounded-sm relative group"
              style={{ minWidth: 4 }}
              title={`${new Date(r.hora).toLocaleString("pt-BR", { timeZone: "America/Maceio" })}: ${r.total} votos`}
            >
              <div
                className={`absolute bottom-0 left-0 right-0 ${
                  i === lastIdx ? "bg-cdl-green" : "bg-cdl-blue"
                } rounded-sm`}
                style={{ height: `${h}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted mt-1 font-mono">
        <span>−48h</span>
        <span>−36h</span>
        <span>−24h</span>
        <span>−12h</span>
        <span>agora ({fmt.format(new Date())}h)</span>
      </div>
    </div>
  );
}

function Aceleracao({ rows }: { rows: AceleracaoRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.votos_24h));
  return (
    <div className="border-t border-[rgba(10,42,94,0.1)] divide-y divide-[rgba(10,42,94,0.06)]">
      {rows.map((r) => (
        <div
          key={r.subcategoria_id}
          className="py-2 grid grid-cols-12 gap-2 items-center text-sm"
        >
          <span className="col-span-6 font-medium text-cdl-blue truncate">
            {r.subcategoria_nome}
          </span>
          <div className="col-span-4 bg-cream-200 rounded h-3 overflow-hidden">
            <div
              className="bg-cdl-blue h-full"
              style={{ width: `${(r.votos_24h / max) * 100}%` }}
            />
          </div>
          <span className="col-span-1 text-right font-mono text-xs text-muted">
            {r.votos_24h}
          </span>
          <span
            className={`col-span-1 text-right font-mono text-xs font-semibold ${
              r.delta > 0
                ? "text-emerald-700"
                : r.delta < 0
                  ? "text-rose-600"
                  : "text-muted"
            }`}
          >
            {r.delta > 0 ? "+" : ""}
            {r.delta}
          </span>
        </div>
      ))}
    </div>
  );
}

function Heatmap({ matrix, max }: { matrix: number[][]; max: number }) {
  // Densidade de cor proporcional ao total
  function bg(total: number): string {
    if (total === 0) return "bg-cream-200";
    const p = total / max;
    if (p > 0.75) return "bg-cdl-blue";
    if (p > 0.5) return "bg-cdl-blue/75";
    if (p > 0.25) return "bg-cdl-blue/50";
    if (p > 0.1) return "bg-cdl-blue/25";
    return "bg-cdl-blue/10";
  }
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex gap-[2px] mb-1 pl-8">
          {Array.from({ length: 24 }).map((_, h) => (
            <div
              key={h}
              className="flex-1 text-[9px] text-muted text-center font-mono"
              style={{ minWidth: 18 }}
            >
              {h}
            </div>
          ))}
        </div>
        {matrix.map((row, dow) => (
          <div key={dow} className="flex gap-[2px] mb-[2px] items-center">
            <span className="w-7 text-[10px] text-muted font-mono">
              {DIAS_SEMANA[dow]}
            </span>
            {row.map((total, hora) => (
              <div
                key={hora}
                className={`flex-1 h-5 rounded-sm ${bg(total)}`}
                style={{ minWidth: 18 }}
                title={`${DIAS_SEMANA[dow]} ${hora}h — ${total} votos`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "ok" | "warn";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted flex items-center gap-1.5">
          {icon} {label}
        </div>
        <div
          className={`text-2xl font-bold mt-1 font-display ${
            tone === "warn" ? "text-amber-600" : "text-cdl-blue"
          }`}
        >
          {value}
        </div>
        {sub && <div className="text-[11px] text-muted mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
