"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BarChart3, AlertCircle, Check, RotateCcw, Users, Send, Inbox, Clock } from "lucide-react";

type Elegivel = {
  votante_id: string;
  votante_nome: string;
  whatsapp: string;
  criado_em?: string;
  votos_count?: number;
};

type Stats = {
  total: number;
  ja_receberam: number;
  na_fila: number;
  enviadas_hoje: number;
  ultima_enviada: string | null;
};

const LOTE_MAX = 50;

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ParcialSection() {
  const [loading, setLoading] = useState<"preview" | "disparar" | "reiniciar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [elegiveis, setElegiveis] = useState<Elegivel[] | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [resultado, setResultado] = useState<{
    enviados: number;
    falhas: number;
    detalhes_falhas: { nome: string; motivo: string }[];
  } | null>(null);
  const [reiniciado, setReiniciado] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const carregarStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/parcial/stats", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStats({
          total: data.total ?? 0,
          ja_receberam: data.ja_receberam ?? 0,
          na_fila: data.na_fila ?? 0,
          enviadas_hoje: data.enviadas_hoje ?? 0,
          ultima_enviada: data.ultima_enviada ?? null,
        });
      }
    } catch {
      // silencioso — stats nao bloqueia operacao
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    carregarStats();
  }, [carregarStats]);

  async function reiniciarFila() {
    if (
      !confirm(
        "Reiniciar a fila? Todos os votantes que já receberam a parcial vão voltar a ficar elegíveis e podem receber outra parcial. Continuar?"
      )
    ) {
      return;
    }
    setLoading("reiniciar");
    setErro(null);
    setReiniciado(null);
    try {
      const res = await fetch("/api/admin/whatsapp/parcial/reiniciar-fila", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha");
      setReiniciado(data.resetados ?? 0);
      setElegiveis(null);
      setSelecionados(new Set());
      setResultado(null);
      carregarStats();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(null);
    }
  }

  async function calcular() {
    setLoading("preview");
    setErro(null);
    setResultado(null);
    try {
      const res = await fetch("/api/admin/whatsapp/parcial/preview");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha");
      setElegiveis(data.elegiveis);
      // marcar até LOTE_MAX por padrão
      const ids = (data.elegiveis as Elegivel[])
        .slice(0, LOTE_MAX)
        .map((e) => e.votante_id);
      setSelecionados(new Set(ids));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(null);
    }
  }

  async function disparar() {
    if (selecionados.size === 0) return;
    if (selecionados.size > LOTE_MAX) {
      setErro(`Máximo ${LOTE_MAX} por disparo. Desmarque alguns.`);
      return;
    }
    if (!confirm(`Enviar parcial para ${selecionados.size} pessoa(s)? Não dá pra desfazer.`)) return;
    setLoading("disparar");
    setErro(null);
    try {
      const res = await fetch("/api/admin/whatsapp/parcial/disparar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votante_ids: Array.from(selecionados) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha");
      setResultado({
        enviados: data.enviados,
        falhas: data.falhas,
        detalhes_falhas: data.detalhes_falhas ?? [],
      });
      setElegiveis(null);
      setSelecionados(new Set());
      carregarStats();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(null);
    }
  }

  function toggle(id: string) {
    const next = new Set(selecionados);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelecionados(next);
  }

  return (
    <Card className="mt-6">
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-cdl-blue" />
          <h2 className="font-display text-xl font-bold text-cdl-blue">
            Parcial personalizada
          </h2>
        </div>
        <p className="text-sm text-muted mb-4">
          Manda WhatsApp com top 3 (+ %) das 3 subcategorias mais acirradas em
          que cada votante votou. Só envia para quem tem WhatsApp validado, ao
          menos 1 voto registrado e ainda não recebeu a parcial.
        </p>

        {stats && (
          <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={<Users className="w-4 h-4" />}
              label="Total elegíveis"
              value={stats.total}
              hint="validados + com voto"
            />
            <StatCard
              icon={<Check className="w-4 h-4 text-emerald-600" />}
              label="Já receberam"
              value={stats.ja_receberam}
              hint={stats.total > 0 ? `${Math.round((stats.ja_receberam / stats.total) * 100)}%` : ""}
            />
            <StatCard
              icon={<Inbox className="w-4 h-4 text-amber-600" />}
              label="Faltam receber"
              value={stats.na_fila}
              hint={stats.total > 0 ? `${Math.round((stats.na_fila / stats.total) * 100)}%` : ""}
              highlight={stats.na_fila > 0}
            />
            <StatCard
              icon={<Send className="w-4 h-4 text-cdl-blue" />}
              label="Enviadas hoje"
              value={stats.enviadas_hoje}
              hint={
                stats.ultima_enviada
                  ? `última: ${formatDateTime(stats.ultima_enviada)}`
                  : "nenhuma ainda"
              }
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button onClick={calcular} loading={loading === "preview"}>
            Calcular elegíveis
          </Button>
          <Button
            variant="ghost"
            onClick={reiniciarFila}
            loading={loading === "reiniciar"}
            disabled={loading === "preview" || loading === "disparar"}
            title="Marca todos os votantes como elegíveis novamente (limpa parcial_enviada_em)"
          >
            <RotateCcw className="w-4 h-4 mr-1" /> Reiniciar fila
          </Button>
        </div>

        {erro && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 mb-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {reiniciado !== null && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-cdl-blue/10 border border-cdl-blue/30 text-sm text-cdl-blue mb-3">
            <RotateCcw className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Fila reiniciada. <strong>{reiniciado}</strong> votante(s) voltam a
              ficar elegíveis. Clique em &quot;Calcular elegíveis&quot; pra
              começar a próxima rodada.
            </span>
          </div>
        )}

        {resultado && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800 mb-3">
            <Check className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <strong>{resultado.enviados} enviados</strong>
              {resultado.falhas > 0 && (
                <span className="text-red-700"> · {resultado.falhas} falhas</span>
              )}
              {resultado.detalhes_falhas.length > 0 && (
                <ul className="text-xs mt-1 text-red-700">
                  {resultado.detalhes_falhas.slice(0, 5).map((f, i) => (
                    <li key={i}>
                      {f.nome}: {f.motivo}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {elegiveis && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted">
                {elegiveis.length} elegível(eis) ·{" "}
                <strong>{selecionados.size}</strong> selecionada(s) (máx {LOTE_MAX})
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const ids = elegiveis.slice(0, LOTE_MAX).map((e) => e.votante_id);
                    setSelecionados(new Set(ids));
                  }}
                >
                  Marcar primeiros {LOTE_MAX}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelecionados(new Set())}>
                  Desmarcar
                </Button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {elegiveis.length === 0 && (
                <p className="text-center text-sm text-muted py-12">
                  Ninguém elegível.
                </p>
              )}
              {elegiveis.map((e) => {
                const checked = selecionados.has(e.votante_id);
                return (
                  <label
                    key={e.votante_id}
                    className="flex items-center gap-3 p-3 hover:bg-cream-200 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(e.votante_id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm truncate block">
                        {e.votante_nome}
                      </span>
                      <span className="text-xs text-muted block truncate">
                        {e.whatsapp}
                      </span>
                    </div>
                    <div className="text-right text-xs text-muted shrink-0 flex flex-col items-end gap-0.5">
                      {typeof e.votos_count === "number" && (
                        <span className="font-bold text-cdl-blue tabular-nums">
                          {e.votos_count} {e.votos_count === 1 ? "voto" : "votos"}
                        </span>
                      )}
                      {e.criado_em && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(e.criado_em)}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="mt-4">
              <Button
                onClick={disparar}
                loading={loading === "disparar"}
                disabled={selecionados.size === 0 || selecionados.size > LOTE_MAX}
                className="w-full sm:w-auto"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Disparar parcial para {selecionados.size} pessoa(s)
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight
          ? "bg-amber-50 border-amber-200"
          : "bg-cream-100 border-[rgba(10,42,94,0.12)]"
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted mb-0.5">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="font-display text-2xl font-bold text-cdl-blue tabular-nums leading-none">
        {value.toLocaleString("pt-BR")}
      </div>
      {hint && <div className="text-[11px] text-muted mt-1 truncate">{hint}</div>}
    </div>
  );
}
