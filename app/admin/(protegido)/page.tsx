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
} from "lucide-react";

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

export default async function AdminDashboard() {
  const supabase = createSupabaseAdminClient();

  const [
    { data: edicao },
    { count: totalVotantes },
    { count: totalVotos },
    { count: totalCandidatos },
    { count: sugestoesPendentes },
    { count: whatsappsValidados },
    { count: selfies },
    { data: votantesParaUA },
    { data: ultimosVotantes },
    { data: votosPorDia },
    { data: resultados },
  ] = await Promise.all([
    supabase
      .from("edicao")
      .select("id, ano, nome, inicio_votacao, fim_votacao")
      .eq("ativa", true)
      .order("ano", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("votantes").select("*", { head: true, count: "exact" }),
    supabase.from("votos").select("*", { head: true, count: "exact" }),
    supabase.from("candidatos").select("*", { head: true, count: "exact" }).eq("status", "aprovado"),
    supabase.from("candidatos").select("*", { head: true, count: "exact" }).eq("status", "pendente"),
    supabase.from("votantes").select("*", { head: true, count: "exact" }).eq("whatsapp_validado", true),
    supabase.from("votantes").select("*", { head: true, count: "exact" }).not("selfie_url", "is", null),
    supabase.from("votantes").select("user_agent"),
    supabase
      .from("votantes")
      .select("id, nome, user_agent, criado_em")
      .order("criado_em", { ascending: false })
      .limit(8),
    supabase.from("votos").select("criado_em").order("criado_em"),
    supabase.from("v_resultados").select("*"),
  ]);

  // Cálculos derivados
  const votantesNum = totalVotantes ?? 0;
  const votosNum = totalVotos ?? 0;
  const conversao = votantesNum > 0 ? Math.round((votosNum / votantesNum) * 100) / 100 : 0;
  const mediaVotosPorVotante = votantesNum > 0 ? (votosNum / votantesNum).toFixed(1) : "0";

  // Distribuição por dispositivo
  const dispositivos = countDispositivos((votantesParaUA ?? []).map((v) => v.user_agent ?? ""));
  const totalDisp = dispositivos.mobile + dispositivos.desktop;

  // Votos por dia (últimos 14)
  const dias14 = bucketByDay((votosPorDia ?? []).map((v) => v.criado_em), 14);
  const maxDia = Math.max(1, ...dias14.map((d) => d.count));

  // Top 5 candidatos (geral)
  const topCandidatos = (resultados ?? [])
    .slice()
    .sort((a, b) => (b as Resultado).total_votos - (a as Resultado).total_votos)
    .slice(0, 8) as Resultado[];

  // Top 5 categorias (somar votos por categoria)
  const porCategoria = new Map<string, { nome: string; votos: number }>();
  for (const r of (resultados ?? []) as Resultado[]) {
    const atual = porCategoria.get(r.categoria_id) ?? { nome: r.categoria_nome, votos: 0 };
    atual.votos += r.total_votos;
    porCategoria.set(r.categoria_id, atual);
  }
  const topCategorias = Array.from(porCategoria.values())
    .sort((a, b) => b.votos - a.votos)
    .slice(0, 5);
  const maxCatVotos = Math.max(1, ...topCategorias.map((c) => c.votos));

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SmallKpi icon={<Trophy />} label="Candidatos" value={fmt(totalCandidatos ?? 0)} link="/admin/candidatos" />
        <SmallKpi icon={<Inbox />} label="Sugestões pendentes" value={fmt(sugestoesPendentes ?? 0)} link="/admin/sugestoes" highlight={(sugestoesPendentes ?? 0) > 0} />
        <SmallKpi icon={<Camera />} label="Selfies registradas" value={fmt(selfies ?? 0)} link="/admin/votantes" />
        <SmallKpi icon={<MessageSquare />} label="Telefones coletados" value={fmt(whatsappsValidados ?? 0)} link="/admin/whatsapp" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Gráfico: votos por dia */}
        <Card className="lg:col-span-2">
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-cdl-blue">Votos por dia</h2>
              <span className="text-xs text-muted">últimos 14 dias</span>
            </div>
            <div className="flex items-end gap-1 h-40">
              {dias14.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full relative flex flex-col-reverse h-full">
                    <div
                      className="w-full bg-cdl-blue rounded-t transition-all group-hover:bg-cdl-blue-light"
                      style={{ height: `${(d.count / maxDia) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}
                      title={`${d.label}: ${d.count} votos`}
                    />
                  </div>
                  <span className="text-[10px] text-muted">{d.label.slice(0, 5)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-xs text-muted">
              <span>0</span>
              <span>{fmt(maxDia)}</span>
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

function SmallKpi({
  icon,
  label,
  value,
  link,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  link: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={link}
      className={`block rounded-2xl border p-4 transition-all hover:shadow-md ${
        highlight
          ? "bg-cdl-yellow/10 border-cdl-yellow/40"
          : "bg-card border-border hover:border-cdl-blue/30"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${highlight ? "bg-cdl-yellow/30 text-cdl-yellow-dark" : "bg-cdl-blue/10 text-cdl-blue"}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted truncate">{label}</p>
          <p className="font-bold text-foreground tabular-nums">{value}</p>
        </div>
      </div>
    </Link>
  );
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
  let acc = 0;
  return (
    <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
      {segments.map((s, i) => {
        const len = (s.value / total) * c;
        const offset = c - acc;
        acc += len;
        return (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${len} ${c}`}
            strokeDashoffset={offset}
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

function countDispositivos(uas: string[]) {
  let mobile = 0;
  let desktop = 0;
  for (const ua of uas) {
    if (/Mobile|Android|iPhone|iPad/i.test(ua)) mobile++;
    else desktop++;
  }
  return { mobile, desktop };
}

function bucketByDay(timestamps: string[], days: number) {
  const buckets: { label: string; count: number; date: Date }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    buckets.push({
      label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      count: 0,
      date: d,
    });
  }

  for (const ts of timestamps) {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    const bucket = buckets.find((b) => b.date.getTime() === d.getTime());
    if (bucket) bucket.count++;
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
