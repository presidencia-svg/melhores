import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  Users,
  Vote,
  TrendingUp,
  Clock,
  Smartphone,
  Monitor,
  MessageSquare,
  Camera,
  Inbox,
  Trophy,
  Zap,
  FolderTree,
} from "lucide-react";
import { EncerramentoCard } from "./EncerramentoCard";
import { SpcCard } from "./SpcCard";

export const revalidate = 30;

type Resultado = {
  candidato_id: string;
  candidato_nome: string;
  subcategoria_id: string;
  subcategoria_nome: string;
  categoria_id: string;
  categoria_nome: string;
  total_votos: number;
};

type VotanteRecente = {
  id: string;
  nome: string;
  user_agent: string | null;
  criado_em: string;
};

type VotosPorDiaRow = { dia: string; total: number };

export default async function AdminDashboard() {
  const supabase = createSupabaseAdminClient();

  const [
    { data: edicao },
    { count: totalVotantes },
    { count: totalVotos },
    { count: totalCandidatos },
    { count: totalCategorias },
    { count: totalSubcategorias },
    { count: sugestoesPendentes },
    { count: whatsappsValidados },
    { count: selfies },
    { count: votantesMobile },
    { data: ultimosVotantes },
    { data: votosPorDia },
    { data: topCandsRaw },
    { data: topCatsRaw },
    { data: resumoHoje },
    { data: votosPorHoraHoje },
    { data: acirradasRaw },
  ] = await Promise.all([
    supabase
      .from("edicao")
      .select(
        "id, ano, nome, inicio_votacao, fim_votacao, divulgacao_resultado"
      )
      .eq("ativa", true)
      .order("ano", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("votantes").select("*", { head: true, count: "exact" }),
    supabase.from("votos").select("*", { head: true, count: "exact" }),
    supabase.from("candidatos").select("*", { head: true, count: "exact" }).eq("status", "aprovado"),
    supabase.from("categorias").select("*", { head: true, count: "exact" }).eq("ativa", true),
    supabase.from("subcategorias").select("*", { head: true, count: "exact" }).eq("ativa", true),
    supabase.from("candidatos").select("*", { head: true, count: "exact" }).eq("status", "pendente"),
    supabase.from("votantes").select("*", { head: true, count: "exact" }).eq("whatsapp_validado", true),
    supabase.from("votantes").select("*", { head: true, count: "exact" }).not("selfie_url", "is", null),
    supabase
      .from("votantes")
      .select("*", { head: true, count: "exact" })
      .or(
        "user_agent.ilike.%Mobile%,user_agent.ilike.%Android%,user_agent.ilike.%iPhone%,user_agent.ilike.%iPad%"
      ),
    supabase
      .from("votantes")
      .select("id, nome, user_agent, criado_em")
      .order("criado_em", { ascending: false })
      .limit(8),
    supabase.from("v_votos_por_dia").select("dia, total"),
    supabase
      .from("v_top_candidatos")
      .select("candidato_id, candidato_nome, subcategoria_id, subcategoria_nome, categoria_id, categoria_nome, total_votos")
      .limit(8),
    supabase
      .from("v_resultados_por_categoria")
      .select("categoria_id, categoria_nome, total_votos")
      .limit(5),
    supabase
      .from("v_resumo_hoje")
      .select("votos, votantes, otps, parciais")
      .maybeSingle(),
    supabase.from("v_votos_por_hora_hoje").select("hora, total"),
    supabase
      .from("v_subcats_acirradas")
      .select(
        "subcategoria_id, subcategoria_nome, primeiro_nome, primeiro_votos, segundo_nome, segundo_votos, diff"
      )
      .limit(5),
  ]);

  // Cálculos derivados
  const votantesNum = totalVotantes ?? 0;
  const votosNum = totalVotos ?? 0;
  const conversao = votantesNum > 0 ? Math.round((votosNum / votantesNum) * 100) / 100 : 0;
  const mediaVotosPorVotante = votantesNum > 0 ? (votosNum / votantesNum).toFixed(1) : "0";

  // Distribuição por dispositivo (count exato, sem amostragem)
  const dispositivos = {
    mobile: votantesMobile ?? 0,
    desktop: Math.max(0, votantesNum - (votantesMobile ?? 0)),
  };
  const totalDisp = dispositivos.mobile + dispositivos.desktop;

  // Votos por dia (últimos 14) — view ja agrega no Postgres
  const dias14 = bucketDaysFromView((votosPorDia ?? []) as VotosPorDiaRow[], 14);
  const maxDia = Math.max(1, ...dias14.map((d) => d.count));

  // Top 8 candidatos (ja sort+limit no Postgres via v_top_candidatos)
  const topCandidatos = (topCandsRaw ?? []) as Resultado[];

  // Top 5 categorias (ja agregada no Postgres via v_resultados_por_categoria)
  const topCategorias = (topCatsRaw ?? []).map((c) => ({
    nome: c.categoria_nome as string,
    votos: Number(c.total_votos),
  }));
  const maxCatVotos = Math.max(1, ...topCategorias.map((c) => c.votos));

  // Resumo de hoje (BRT)
  const hoje = (resumoHoje as { votos?: number; votantes?: number; otps?: number; parciais?: number } | null) ?? {};
  const hojeVotos = Number(hoje.votos ?? 0);
  const hojeVotantes = Number(hoje.votantes ?? 0);
  const hojeOtps = Number(hoje.otps ?? 0);
  const hojeParciais = Number(hoje.parciais ?? 0);

  // Votos por hora hoje — preenche 0..23 com 0
  const horasHoje: { hora: number; total: number }[] = Array.from(
    { length: 24 },
    (_, h) => ({ hora: h, total: 0 })
  );
  for (const r of (votosPorHoraHoje ?? []) as { hora: number; total: number }[]) {
    const idx = Number(r.hora);
    if (idx >= 0 && idx < 24) horasHoje[idx]!.total = Number(r.total);
  }
  const maxHora = Math.max(1, ...horasHoje.map((h) => h.total));

  // Subcategorias acirradas
  type AcirradaRow = {
    subcategoria_id: string;
    subcategoria_nome: string;
    primeiro_nome: string;
    primeiro_votos: number;
    segundo_nome: string;
    segundo_votos: number;
    diff: number;
  };
  const acirradas = (acirradasRaw ?? []) as AcirradaRow[];

  // Tempo restante
  const agora = Date.now();
  const fim = edicao ? new Date(edicao.fim_votacao).getTime() : agora;
  const horasRestantes = Math.max(0, Math.floor((fim - agora) / 3600_000));
  const diasRestantes = Math.floor(horasRestantes / 24);
  const horasFinais = horasRestantes % 24;

  return (
    <div className="p-8">
      {/* Header */}
      <header className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cdl-blue">Visão geral</h1>
          {edicao ? (
            <p className="text-muted mt-1">
              {edicao.nome} · até {new Date(edicao.fim_votacao).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
            </p>
          ) : (
            <p className="text-red-600 mt-1 font-medium">⚠ Nenhuma edição ativa configurada</p>
          )}
        </div>
        {edicao && (
          <div className="rounded-2xl bg-gradient-to-br from-cdl-blue to-cdl-blue-dark text-white px-5 py-3 flex items-center gap-3 shadow-md">
            <Clock className="w-5 h-5" />
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80">Tempo restante</div>
              <div className="font-display font-bold text-lg">
                {diasRestantes > 0 ? `${diasRestantes}d ${horasFinais}h` : `${horasRestantes}h`}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Encerramento da votacao */}
      {edicao && (
        <EncerramentoCard
          fimVotacao={edicao.fim_votacao}
          divulgacaoResultado={edicao.divulgacao_resultado ?? null}
          edicaoNome={edicao.nome}
        />
      )}

      {/* Toggle de consulta SPC */}
      <SpcCard />

      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi
          icon={<Users />}
          label="Votantes únicos"
          value={fmt(votantesNum)}
          accent="blue"
          hint="CPFs identificados"
        />
        <Kpi
          icon={<Vote />}
          label="Votos registrados"
          value={fmt(votosNum)}
          accent="green"
          hint={`média ${mediaVotosPorVotante} por pessoa`}
        />
        <Kpi
          icon={<TrendingUp />}
          label="Engajamento"
          value={`${(conversao * 1).toFixed(1)}`}
          accent="yellow"
          hint="votos por votante"
        />
        <Kpi
          icon={<Zap />}
          label="WhatsApps confirmados"
          value={fmt(whatsappsValidados ?? 0)}
          accent="blue"
          hint={`${pct(whatsappsValidados ?? 0, votantesNum)}% dos votantes`}
        />
      </div>

      {/* KPIs secundários */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <SmallKpi
          icon={<FolderTree />}
          label="Categorias"
          value={fmt(totalCategorias ?? 0)}
          link="/admin/categorias"
          hint={`${fmt(totalSubcategorias ?? 0)} subcategorias`}
        />
        <SmallKpi icon={<Trophy />} label="Candidatos" value={fmt(totalCandidatos ?? 0)} link="/admin/candidatos" />
        <SmallKpi icon={<Inbox />} label="Sugestões pendentes" value={fmt(sugestoesPendentes ?? 0)} link="/admin/sugestoes" highlight={(sugestoesPendentes ?? 0) > 0} />
        <SmallKpi icon={<Camera />} label="Selfies registradas" value={fmt(selfies ?? 0)} link="/admin/votantes" />
        <SmallKpi icon={<MessageSquare />} label="Telefones coletados" value={fmt(whatsappsValidados ?? 0)} link="/admin/whatsapp" />
        <SmallKpi icon={<Vote />} label="Votos no total" value={fmt(votosNum)} />
      </div>

      {/* Hoje (BRT) */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-cdl-blue">Hoje</h2>
            <span className="text-xs text-muted">snapshot do dia em curso</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <HojeMetric icon={<Vote className="w-4 h-4" />} label="Votos hoje" value={hojeVotos} />
            <HojeMetric icon={<Users className="w-4 h-4" />} label="Votantes hoje" value={hojeVotantes} />
            <HojeMetric icon={<Zap className="w-4 h-4" />} label="OTPs hoje" value={hojeOtps} />
            <HojeMetric icon={<MessageSquare className="w-4 h-4" />} label="Parciais hoje" value={hojeParciais} />
          </div>
        </CardContent>
      </Card>

      {/* Votos por hora hoje + Subcategorias acirradas */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-cdl-blue">Votos por hora hoje</h2>
              <span className="text-xs text-muted">
                pico {fmt(maxHora)} às {String(horasHoje.findIndex((h) => h.total === maxHora)).padStart(2, "0")}h
              </span>
            </div>
            <div className="flex gap-0.5 h-32">
              {horasHoje.map((h) => {
                const pct = (h.total / maxHora) * 100;
                const isPeak = h.total > 0 && h.total === maxHora;
                return (
                  <div key={h.hora} className="flex-1 h-full flex flex-col group">
                    <div className="flex-1 flex flex-col-reverse min-h-0">
                      <div
                        className={`w-full rounded-t transition-colors ${
                          isPeak ? "bg-cdl-yellow" : "bg-cdl-blue group-hover:bg-cdl-blue-light"
                        }`}
                        style={{ height: `${pct}%`, minHeight: h.total > 0 ? 2 : 0 }}
                        title={`${String(h.hora).padStart(2, "0")}h: ${h.total} votos`}
                      />
                    </div>
                    <span className="text-[9px] text-muted mt-1 text-center font-mono">
                      {h.hora % 3 === 0 ? String(h.hora).padStart(2, "0") : ""}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-xs text-muted">
              {hojeVotos > 0
                ? `${fmt(hojeVotos)} votos hoje · ${(hojeVotos / 24).toFixed(0)}/h média`
                : "ainda sem votos hoje"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-cdl-blue">Subcategorias acirradas</h2>
              <span className="text-xs text-muted">candidatas a incentivo</span>
            </div>
            {acirradas.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">
                Sem disputas próximas ainda.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {acirradas.map((a) => (
                  <div key={a.subcategoria_id} className="py-2.5 flex items-center gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-cdl-blue truncate">{a.subcategoria_nome}</div>
                      <div className="text-xs text-muted truncate">
                        1º <strong className="text-foreground">{a.primeiro_nome}</strong> ({a.primeiro_votos}) · 2º {a.segundo_nome} ({a.segundo_votos})
                      </div>
                    </div>
                    <span
                      className={`shrink-0 font-mono text-sm font-bold tabular-nums ${
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
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Gráfico: votos por dia */}
        <Card className="lg:col-span-2">
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-cdl-blue">Votos por dia</h2>
              <div className="flex items-center gap-3 text-xs text-muted">
                <span>últimos 14 dias</span>
                <span>·</span>
                <span>
                  total <strong className="text-cdl-blue">{fmt(dias14.reduce((a, d) => a + d.count, 0))}</strong>
                </span>
              </div>
            </div>
            <div className="flex gap-1 h-56">
              {dias14.map((d, i) => {
                const heightPct = (d.count / maxDia) * 100;
                return (
                  <div key={i} className="flex-1 h-full flex flex-col group">
                    <div className="h-5 flex items-end justify-center">
                      <span
                        className={`text-[11px] font-bold tabular-nums leading-none whitespace-nowrap ${
                          d.count > 0 ? "text-cdl-blue" : "text-transparent"
                        }`}
                      >
                        {fmt(d.count)}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col-reverse min-h-0">
                      <div
                        className="w-full bg-cdl-blue rounded-t transition-all group-hover:bg-cdl-blue-light"
                        style={{ height: `${heightPct}%`, minHeight: d.count > 0 ? 4 : 0 }}
                        title={`${d.label}: ${d.count} votos`}
                      />
                    </div>
                    <span className="text-[10px] text-muted mt-1 text-center">
                      {d.label.slice(0, 5)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex justify-between text-xs text-muted">
              <span>0</span>
              <span>pico {fmt(maxDia)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Donut: dispositivos */}
        <Card>
          <CardContent>
            <h2 className="font-display text-lg font-bold text-cdl-blue mb-4">Dispositivos</h2>
            <DonutChart
              segments={[
                { label: "Celular", value: dispositivos.mobile, color: "#1B3A7A" },
                { label: "Computador", value: dispositivos.desktop, color: "#00A859" },
              ]}
              total={totalDisp}
            />
            <div className="mt-3 space-y-2">
              <Legend
                icon={<Smartphone className="w-3 h-3" />}
                label="Celular"
                value={dispositivos.mobile}
                pct={pct(dispositivos.mobile, totalDisp)}
                color="bg-cdl-blue"
              />
              <Legend
                icon={<Monitor className="w-3 h-3" />}
                label="Computador"
                value={dispositivos.desktop}
                pct={pct(dispositivos.desktop, totalDisp)}
                color="bg-cdl-green"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Top categorias */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-cdl-blue">Top categorias</h2>
              <Link href="/admin/resultados" className="text-xs text-cdl-blue hover:underline">
                Ver todas →
              </Link>
            </div>
            {topCategorias.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">Sem votos ainda.</p>
            ) : (
              <div className="space-y-3">
                {topCategorias.map((cat) => (
                  <div key={cat.nome}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{cat.nome}</span>
                      <span className="text-cdl-blue font-bold tabular-nums">{fmt(cat.votos)}</span>
                    </div>
                    <div className="h-2 bg-cdl-blue/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cdl-blue to-cdl-blue-light rounded-full"
                        style={{ width: `${(cat.votos / maxCatVotos) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top candidatos */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-cdl-blue">Top candidatos</h2>
              <Link href="/admin/resultados" className="text-xs text-cdl-blue hover:underline">
                Ver todos →
              </Link>
            </div>
            {topCandidatos.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">Sem votos ainda.</p>
            ) : (
              <ol className="space-y-2">
                {topCandidatos.slice(0, 8).map((c, idx) => (
                  <li key={c.candidato_id} className="flex items-center gap-3 text-sm">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? "bg-cdl-yellow text-cdl-blue-dark"
                          : idx < 3
                          ? "bg-cdl-blue/10 text-cdl-blue"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1 truncate">{c.candidato_nome}</span>
                    <span className="text-xs text-muted truncate hidden sm:inline">{c.subcategoria_nome}</span>
                    <span className="font-bold text-cdl-blue tabular-nums">{c.total_votos}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Atividade recente */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-cdl-blue">Atividade recente</h2>
            <Link href="/admin/votantes" className="text-xs text-cdl-blue hover:underline">
              Ver todos →
            </Link>
          </div>
          {(ultimosVotantes ?? []).length === 0 ? (
            <p className="text-sm text-muted text-center py-8">Aguardando votantes.</p>
          ) : (
            <div className="divide-y divide-border">
              {(ultimosVotantes as VotanteRecente[]).map((v) => {
                const isMobile = /Mobile|Android|iPhone/i.test(v.user_agent ?? "");
                const tempo = relativeTime(v.criado_em);
                return (
                  <div key={v.id} className="py-2.5 flex items-center gap-3 text-sm">
                    {isMobile ? <Smartphone className="w-4 h-4 text-muted" /> : <Monitor className="w-4 h-4 text-muted" />}
                    <span className="flex-1 truncate font-medium">{v.nome}</span>
                    <span className="text-xs text-muted">{tempo}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Componentes auxiliares
// ──────────────────────────────────────────────────────────────────────────

function Kpi({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent: "blue" | "green" | "yellow";
}) {
  const accents = {
    blue: "bg-cdl-blue/10 text-cdl-blue",
    green: "bg-cdl-green/10 text-cdl-green-dark",
    yellow: "bg-cdl-yellow/15 text-cdl-yellow-dark",
  } as const;
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</p>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accents[accent]}`}>
            {icon}
          </div>
        </div>
        <p className="font-display text-3xl font-bold text-foreground">{value}</p>
        {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function HojeMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-cdl-blue/10 text-cdl-blue flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted truncate">{label}</p>
        <p className="font-display text-2xl font-bold text-cdl-blue tabular-nums">
          {fmt(value)}
        </p>
      </div>
    </div>
  );
}

function SmallKpi({
  icon,
  label,
  value,
  link,
  highlight,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  link?: string;
  highlight?: boolean;
  hint?: string;
}) {
  const content = (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${highlight ? "bg-cdl-yellow/30 text-cdl-yellow-dark" : "bg-cdl-blue/10 text-cdl-blue"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted truncate">{label}</p>
        <p className="font-bold text-foreground tabular-nums">{value}</p>
        {hint && <p className="text-[10px] text-muted truncate">{hint}</p>}
      </div>
    </div>
  );
  const className = `block rounded-2xl border p-4 transition-all hover:shadow-md ${
    highlight
      ? "bg-cdl-yellow/10 border-cdl-yellow/40"
      : "bg-card border-border hover:border-cdl-blue/30"
  }`;
  if (link) {
    return (
      <Link href={link} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}

function DonutChart({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) {
  if (total === 0) {
    return (
      <div className="aspect-square w-32 mx-auto rounded-full border-8 border-zinc-100 flex items-center justify-center text-xs text-muted">
        sem dados
      </div>
    );
  }
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
      {segments.map((s, i, arr) => {
        const len = (s.value / total) * c;
        // Acumula tamanho dos segmentos anteriores (sem mutar fora do escopo)
        const offsetBefore = arr
          .slice(0, i)
          .reduce((sum, x) => sum + (x.value / total) * c, 0);
        return (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offsetBefore}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}

function Legend({
  icon,
  label,
  value,
  pct,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-3 h-3 rounded-sm ${color} flex items-center justify-center text-white`}>{icon}</span>
      <span className="flex-1 text-muted">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
      <span className="text-muted tabular-nums">({pct}%)</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("pt-BR");
}

function pct(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

function bucketDaysFromView(rows: VotosPorDiaRow[], days: number) {
  const byDate = new Map<string, number>();
  for (const r of rows) byDate.set(r.dia, (byDate.get(r.dia) ?? 0) + r.total);

  const buckets: { label: string; count: number; date: Date }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    buckets.push({
      label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      count: byDate.get(iso) ?? 0,
      date: d,
    });
  }
  return buckets;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}
