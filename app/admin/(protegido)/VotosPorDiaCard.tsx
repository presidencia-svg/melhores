"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Smartphone, Monitor, X } from "lucide-react";

const PERIODOS: { value: number | "tudo"; label: string }[] = [
  { value: 7, label: "7d" },
  { value: 14, label: "14d" },
  { value: 30, label: "30d" },
  { value: 60, label: "60d" },
  { value: 90, label: "90d" },
  { value: "tudo", label: "Tudo" },
];

type Dia = { iso: string; label: string; count: number };

type Detalhe = {
  dia: string;
  total: number;
  por_hora: { hora: number; total: number }[];
  por_so: { so: string; total: number }[];
};

const SO_LABEL: Record<string, string> = {
  ios: "iPhone / iPad",
  android: "Android",
  windows: "Windows",
  mac: "Mac",
  linux: "Linux",
  outro: "Outro",
  desconhecido: "Desconhecido",
};

const SO_COR: Record<string, string> = {
  ios: "#1B3A7A",
  android: "#00A859",
  windows: "#3B82F6",
  mac: "#64748B",
  linux: "#F59E0B",
  outro: "#A855F7",
  desconhecido: "#9CA3AF",
};

function fmt(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function VotosPorDiaCard({
  dias,
  maxDia,
  periodo,
  edicaoId,
}: {
  dias: Dia[];
  maxDia: number;
  periodo: number | "tudo";
  edicaoId: string | null;
}) {
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const totalPeriodo = dias.reduce((a, d) => a + d.count, 0);
  const periodoLabel =
    periodo === "tudo" ? `todo o periodo (${dias.length} dias)` : `últimos ${periodo} dias`;

  // Monta o href de cada periodo, preservando ?edicao=<id> quando
  // estamos vendo uma edicao historica.
  function hrefPeriodo(p: number | "tudo"): string {
    const sp = new URLSearchParams();
    sp.set("periodo", String(p));
    if (edicaoId) sp.set("edicao", edicaoId);
    return `/admin?${sp.toString()}`;
  }

  async function abrir(iso: string, count: number) {
    if (count === 0) return;
    if (selecionado === iso) {
      setSelecionado(null);
      setDetalhe(null);
      return;
    }
    setSelecionado(iso);
    setDetalhe(null);
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch(`/api/admin/votos-dia/${iso}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Detalhe;
      setDetalhe(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro ao carregar");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Card className="lg:col-span-2">
      <CardContent>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="font-display text-lg font-bold text-cdl-blue">Votos por dia</h2>
          <div className="flex items-center gap-3 text-xs text-muted">
            <nav className="flex gap-0.5 bg-cream-100 border border-[rgba(10,42,94,0.15)] rounded-md p-0.5">
              {PERIODOS.map((p) => {
                const ativo = p.value === periodo;
                return (
                  <Link
                    key={String(p.value)}
                    href={hrefPeriodo(p.value)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      ativo
                        ? "bg-cdl-blue text-white"
                        : "text-cdl-blue hover:bg-cdl-blue/10"
                    }`}
                  >
                    {p.label}
                  </Link>
                );
              })}
            </nav>
            <span className="hidden sm:inline">·</span>
            <span>
              <span className="hidden sm:inline">{periodoLabel} · </span>
              total <strong className="text-cdl-blue">{fmt(totalPeriodo)}</strong>
            </span>
          </div>
        </div>
        <div className="flex gap-1 h-56">
          {dias.map((d) => {
            const heightPct = (d.count / maxDia) * 100;
            const ativo = selecionado === d.iso;
            const clicavel = d.count > 0;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => abrir(d.iso, d.count)}
                disabled={!clicavel}
                className={`flex-1 h-full flex flex-col group ${
                  clicavel ? "cursor-pointer" : "cursor-default"
                }`}
                title={clicavel ? `${d.label}: ${fmt(d.count)} votos · clique pra detalhar` : `${d.label}: sem votos`}
              >
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
                    className={`w-full rounded-t transition-all ${
                      ativo
                        ? "bg-cdl-yellow"
                        : "bg-cdl-blue group-hover:bg-cdl-blue-light"
                    }`}
                    style={{ height: `${heightPct}%`, minHeight: d.count > 0 ? 4 : 0 }}
                  />
                </div>
                <span className={`text-[10px] mt-1 text-center ${ativo ? "text-cdl-blue font-bold" : "text-muted"}`}>
                  {d.label.slice(0, 5)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex justify-between text-xs text-muted">
          <span>0</span>
          <span>pico {fmt(maxDia)}</span>
        </div>

        {selecionado && (
          <div className="mt-5 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-bold text-cdl-blue">
                Detalhe de {labelDia(selecionado)}
                {detalhe && (
                  <span className="ml-2 text-xs text-muted font-normal">
                    · {fmt(detalhe.total)} votos
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelecionado(null);
                  setDetalhe(null);
                }}
                className="text-muted hover:text-foreground p-1"
                aria-label="Fechar detalhe"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {carregando && <p className="text-sm text-muted py-6 text-center">carregando…</p>}
            {erro && <p className="text-sm text-red-600 py-6 text-center">erro: {erro}</p>}

            {detalhe && !carregando && (
              <div className="grid md:grid-cols-2 gap-6">
                <PorHora dados={detalhe.por_hora} />
                <PorSO dados={detalhe.por_so} total={detalhe.total} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PorHora({ dados }: { dados: { hora: number; total: number }[] }) {
  const horas: { hora: number; total: number }[] = Array.from(
    { length: 24 },
    (_, h) => ({ hora: h, total: 0 })
  );
  for (const r of dados) {
    if (r.hora >= 0 && r.hora < 24) horas[r.hora]!.total = r.total;
  }
  const max = Math.max(1, ...horas.map((h) => h.total));
  const peakIdx = horas.findIndex((h) => h.total === max);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">Por hora</h4>
        <span className="text-[11px] text-muted">
          pico {fmt(max)} às {String(peakIdx).padStart(2, "0")}h
        </span>
      </div>
      <div className="flex gap-0.5 h-28">
        {horas.map((h) => {
          const pct = (h.total / max) * 100;
          const isPeak = h.total > 0 && h.total === max;
          return (
            <div key={h.hora} className="flex-1 h-full flex flex-col group">
              <div className="flex-1 flex flex-col-reverse min-h-0">
                <div
                  className={`w-full rounded-t transition-colors ${
                    isPeak ? "bg-cdl-yellow" : "bg-cdl-blue group-hover:bg-cdl-blue-light"
                  }`}
                  style={{ height: `${pct}%`, minHeight: h.total > 0 ? 2 : 0 }}
                  title={`${String(h.hora).padStart(2, "0")}h: ${fmt(h.total)} votos`}
                />
              </div>
              <span className="text-[9px] text-muted mt-1 text-center font-mono">
                {h.hora % 3 === 0 ? String(h.hora).padStart(2, "0") : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PorSO({
  dados,
  total,
}: {
  dados: { so: string; total: number }[];
  total: number;
}) {
  const max = Math.max(1, ...dados.map((d) => d.total));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">Por sistema</h4>
        <span className="text-[11px] text-muted">votante × SO</span>
      </div>
      {dados.length === 0 ? (
        <p className="text-sm text-muted py-6 text-center">sem dados</p>
      ) : (
        <div className="space-y-1.5">
          {dados.map((d) => {
            const pct = (d.total / max) * 100;
            const pctTotal = total > 0 ? Math.round((d.total / total) * 100) : 0;
            const cor = SO_COR[d.so] ?? "#1B3A7A";
            const Icon = ["ios", "android"].includes(d.so) ? Smartphone : Monitor;
            return (
              <div key={d.so} className="flex items-center gap-2 text-xs">
                <Icon className="w-3 h-3 text-muted shrink-0" style={{ color: cor }} />
                <span className="w-24 truncate text-foreground">{SO_LABEL[d.so] ?? d.so}</span>
                <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: cor }}
                  />
                </div>
                <span className="w-14 text-right font-mono tabular-nums text-foreground">
                  {fmt(d.total)}
                </span>
                <span className="w-9 text-right text-muted tabular-nums">{pctTotal}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function labelDia(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}
