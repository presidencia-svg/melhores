"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Award,
  AlertCircle,
  Check,
  Users,
  Send,
  Inbox,
  Clock,
  Trophy,
} from "lucide-react";

type Elegivel = {
  votante_id: string;
  votante_nome: string;
  whatsapp: string;
  criado_em?: string;
  campeoes_nomes: string[];
};

type Stats = {
  total: number;
  ja_receberam: number;
  na_fila: number;
  enviadas_hoje: number;
  ultima_enviada: string | null;
};

const LOTE_MAX = 50;
const MAX_CAMPEOES_NA_MSG = 3;

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

export function CerimoniaSection() {
  const [loading, setLoading] = useState<"preview" | "disparar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [elegiveis, setElegiveis] = useState<Elegivel[] | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [porCampeao, setPorCampeao] = useState(10);
  const [resultado, setResultado] = useState<{
    enviados: number;
    falhas: number;
    detalhes_falhas: { nome: string; motivo: string }[];
  } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const carregarStats = useCallback(async (n: number) => {
    try {
      const res = await fetch(
        `/api/admin/whatsapp/cerimonia/stats?por_campeao=${n}`,
        { cache: "no-store" }
      );
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
      // silencioso
    }
  }, []);

  // Re-fetch stats sempre que porCampeao muda (debounce 350ms pra nao
  // bombardear servidor enquanto usuario digita).
  useEffect(() => {
    const t = setTimeout(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- debounced
      carregarStats(porCampeao);
    }, 350);
    return () => clearTimeout(t);
  }, [porCampeao, carregarStats]);

  async function calcular() {
    setLoading("preview");
    setErro(null);
    setResultado(null);
    try {
      const res = await fetch(
        `/api/admin/whatsapp/cerimonia/preview?por_campeao=${porCampeao}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha");
      setElegiveis(data.elegiveis);
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
    if (!elegiveis || selecionados.size === 0) return;
    if (selecionados.size > LOTE_MAX) {
      setErro(`Máximo ${LOTE_MAX} por disparo. Desmarque alguns.`);
      return;
    }
    // Preco fonte: lib/creditos/index.ts → PRECOS.marketing (80 centavos).
    const PRECO_CENTAVOS = 80;
    const totalCentavos = selecionados.size * PRECO_CENTAVOS;
    const totalFmt = `R$ ${(totalCentavos / 100).toFixed(2).replace(".", ",")}`;
    if (
      !confirm(
        `Enviar para ${selecionados.size} pessoa(s)? Cada mensagem custa R$ 0,80 (template Marketing) — total ${totalFmt}. Não dá pra desfazer.`
      )
    )
      return;
    setLoading("disparar");
    setErro(null);
    try {
      const payloads = elegiveis
        .filter((e) => selecionados.has(e.votante_id))
        .map((e) => ({
          votante_id: e.votante_id,
          campeoes_nomes: e.campeoes_nomes.slice(0, MAX_CAMPEOES_NA_MSG),
        }));
      const res = await fetch("/api/admin/whatsapp/cerimonia/disparar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payloads }),
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
      carregarStats(porCampeao);
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
          <Award className="w-5 h-5 text-cdl-yellow-dark" />
          <h2 className="font-display text-xl font-bold text-cdl-blue">
            Aviso de cerimônia · &quot;avisa o campeão&quot;
          </h2>
        </div>
        <p className="text-sm text-muted mb-4">
          Manda WhatsApp pros votantes pedindo pra avisarem quem eles votaram
          (e ganhou) que o certificado já pode ser retirado na sede da CDL
          Aracaju nos dias <strong>13 e 14 de maio</strong>, das{" "}
          <strong>8h às 18h</strong>. Cada mensagem lista até{" "}
          <strong>3 vencedores</strong> que aquela pessoa escolheu. Dedup
          garantido: 1 mensagem por pessoa.
        </p>

        {stats && (
          <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={<Users className="w-4 h-4" />}
              label="Total elegíveis"
              value={stats.total}
              hint={`top ${porCampeao}/campeão · com dedup`}
            />
            <StatCard
              icon={<Check className="w-4 h-4 text-emerald-600" />}
              label="Já receberam"
              value={stats.ja_receberam}
              hint={
                stats.total > 0
                  ? `${Math.round((stats.ja_receberam / stats.total) * 100)}%`
                  : ""
              }
            />
            <StatCard
              icon={<Inbox className="w-4 h-4 text-amber-600" />}
              label="Faltam receber"
              value={stats.na_fila}
              hint={
                stats.total > 0
                  ? `${Math.round((stats.na_fila / stats.total) * 100)}%`
                  : ""
              }
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

        <div className="flex flex-wrap items-end gap-3 mb-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-muted font-mono">
              Votantes por campeão
            </span>
            <input
              type="number"
              min={1}
              max={100}
              value={porCampeao}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (Number.isFinite(n) && n >= 1 && n <= 100) setPorCampeao(n);
              }}
              className="border border-cdl-blue/20 rounded-md px-3 py-2 text-sm bg-white w-32"
            />
          </label>
          <Button onClick={calcular} loading={loading === "preview"}>
            Calcular elegíveis
          </Button>
        </div>

        {erro && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 mb-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {resultado && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800 mb-3">
            <Check className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <strong>{resultado.enviados} enviados</strong>
              {resultado.falhas > 0 && (
                <span className="text-red-700">
                  {" "}
                  · {resultado.falhas} falhas
                </span>
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
                <strong>{selecionados.size}</strong> selecionada(s) (máx{" "}
                {LOTE_MAX})
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const ids = elegiveis
                      .slice(0, LOTE_MAX)
                      .map((e) => e.votante_id);
                    setSelecionados(new Set(ids));
                  }}
                >
                  Marcar primeiros {LOTE_MAX}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelecionados(new Set())}
                >
                  Desmarcar
                </Button>
              </div>
            </div>

            <div className="max-h-[480px] overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {elegiveis.length === 0 && (
                <p className="text-center text-sm text-muted py-12">
                  Ninguém elegível.
                </p>
              )}
              {elegiveis.map((e) => {
                const checked = selecionados.has(e.votante_id);
                const campeoesParaMsg = e.campeoes_nomes.slice(
                  0,
                  MAX_CAMPEOES_NA_MSG
                );
                const extras = e.campeoes_nomes.length - campeoesParaMsg.length;
                return (
                  <label
                    key={e.votante_id}
                    className="flex items-start gap-3 p-3 hover:bg-cream-200 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(e.votante_id)}
                      className="w-4 h-4 mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-medium text-sm truncate">
                          {e.votante_nome}
                        </span>
                        <span className="text-xs text-muted font-mono shrink-0">
                          {e.whatsapp}
                        </span>
                      </div>
                      <div className="mt-1 flex items-start gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-cdl-yellow-dark shrink-0 mt-0.5" />
                        <div className="text-xs leading-snug">
                          <span className="text-cdl-blue font-medium">
                            {campeoesParaMsg.join(" · ")}
                          </span>
                          {extras > 0 && (
                            <span className="text-muted">
                              {" "}
                              (+{extras} fora da msg)
                            </span>
                          )}
                        </div>
                      </div>
                      {e.criado_em && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(e.criado_em)}
                        </div>
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
                disabled={
                  selecionados.size === 0 || selecionados.size > LOTE_MAX
                }
                className="w-full sm:w-auto"
              >
                <Award className="w-4 h-4 mr-2" />
                Disparar aviso para {selecionados.size} pessoa(s)
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
      {hint && (
        <div className="text-[11px] text-muted mt-1 truncate">{hint}</div>
      )}
    </div>
  );
}
