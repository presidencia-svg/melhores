import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { fetchMetaInsights } from "@/lib/meta-whatsapp/insights";
import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Send,
  TrendingUp,
  Trophy,
  Users,
  Vote,
  XCircle,
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

function pct(num: number, den: number): number {
  return den > 0 ? (num / den) * 100 : 0;
}

function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function clampDays(input: string | undefined): number {
  const n = parseInt(input ?? "7", 10);
  if (!Number.isFinite(n)) return 7;
  if (n < 1) return 1;
  if (n > 90) return 90;
  return n;
}

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
  const supabase = createSupabaseAdminClient();

  const [
    metaInsights,
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
    supabase.rpc("insights_otp_periodo", { dias: days }),
    supabase.rpc("insights_votos_periodo", { dias: days }),
    supabase
      .from("votantes")
      .select("id", { head: true, count: "exact" })
      .gte("criado_em", cutoff),
    supabase.from("votantes").select("id", { head: true, count: "exact" }),
    supabase
      .from("votantes")
      .select("id", { head: true, count: "exact" })
      .eq("whatsapp_validado", true),
    supabase
      .from("votantes")
      .select("id", { head: true, count: "exact" })
      .not("parcial_enviada_em", "is", null)
      .gte("parcial_enviada_em", cutoff),
    supabase
      .from("votantes")
      .select("id", { head: true, count: "exact" })
      .not("incentivo_enviado_em", "is", null)
      .gte("incentivo_enviado_em", cutoff),
    supabase.from("v_votos_por_dia").select("dia, total"),
    supabase
      .from("v_resultados")
      .select("subcategoria_id, subcategoria_nome, candidato_nome, total_votos"),
    supabase.from("v_otp_por_dia").select("dia, total"),
  ]);

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

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-cdl-blue flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-cdl-green" />
            Insights WhatsApp
          </h1>
          <p className="text-muted mt-1">
            Métricas internas (Supabase) + entrega real da Meta Cloud API
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
          label="WhatsApps validados"
          value={validadosTotal.toLocaleString("pt-BR")}
          sub={`${pct(validadosTotal, votantesTotal).toFixed(1)}% dos votantes`}
        />
        <Kpi
          icon={<TrendingUp className="w-4 h-4 text-cdl-blue" />}
          label="Conversão registro→voto"
          value={`${conversao.toFixed(1)}%`}
          sub={`${votantesQueVotaram}/${votantesPeriodo} no período`}
        />
      </section>

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

      <Card>
        <CardHeader>
          <h2 className="font-display text-xl font-semibold text-cdl-blue">
            Atividade diária ({days} dias)
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
              sub={`Custo: ${formatBRL(metaInsights.conversations.total_cost)}`}
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
                Conversas por categoria
              </h2>
            </CardHeader>
            <CardContent className="pt-0">
              {metaInsights.conversations.by_category.length === 0 ? (
                <p className="text-sm text-muted py-6 text-center">Sem dados no período.</p>
              ) : (
                <div className="border-t border-[rgba(10,42,94,0.1)] divide-y divide-[rgba(10,42,94,0.06)]">
                  {metaInsights.conversations.by_category.map((c) => (
                    <div
                      key={c.category}
                      className="py-2.5 grid grid-cols-12 gap-2 text-sm items-center"
                    >
                      <span className="col-span-5 font-medium">
                        {CATEGORY_LABEL[c.category] ?? c.category}
                      </span>
                      <span className="col-span-3 text-right font-mono">
                        {c.conversation.toLocaleString("pt-BR")}
                      </span>
                      <span className="col-span-2 text-right text-xs text-muted">
                        {pct(c.conversation, metaInsights.conversations.total).toFixed(1)}%
                      </span>
                      <span className="col-span-2 text-right">{formatBRL(c.cost)}</span>
                    </div>
                  ))}
                </div>
              )}
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
