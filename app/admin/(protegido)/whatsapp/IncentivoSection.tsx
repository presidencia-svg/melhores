"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Send, AlertCircle, Check, Inbox, Clock } from "lucide-react";

type Elegivel = {
  votante_id: string;
  votante_nome: string;
  whatsapp: string;
  categoria_nome: string;
  subcategoria_id: string;
  subcategoria_nome: string;
  candidato_perdendo_id: string;
  candidato_perdendo_nome: string;
  candidato_perdendo_votos: number;
  candidato_lider_nome: string;
  candidato_lider_votos: number;
  diferenca: number;
};

type Stats = {
  ja_receberam: number;
  enviadas_hoje: number;
  ultima_enviada: string | null;
};

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

export function IncentivoSection() {
  const [threshold, setThreshold] = useState(5);
  const [cooldown, setCooldown] = useState(30);
  const [loading, setLoading] = useState<"preview" | "disparar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [elegiveis, setElegiveis] = useState<Elegivel[] | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [resultado, setResultado] = useState<{
    enviados: number;
    falhas: number;
    detalhes_falhas: { nome: string; motivo: string }[];
    restantes: number;
  } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const carregarStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/incentivo/stats", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStats({
          ja_receberam: data.ja_receberam ?? 0,
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

  async function calcular() {
    setLoading("preview");
    setErro(null);
    setResultado(null);
    try {
      const res = await fetch(`/api/admin/whatsapp/incentivo/preview?threshold=${threshold}&cooldown=${cooldown}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha");
      setElegiveis(data.elegiveis);
      // por padrão, selecionar todos (1 por votante — o backend deduplica)
      const ids = new Set<string>(
        (data.elegiveis as Elegivel[]).map((e) => e.votante_id)
      );
      setSelecionados(ids);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(null);
    }
  }

  async function disparar() {
    if (selecionados.size === 0) return;
    if (!confirm(`Enviar mensagem para ${selecionados.size} pessoa(s)? Não dá pra desfazer.`)) return;
    setLoading("disparar");
    setErro(null);
    try {
      const res = await fetch("/api/admin/whatsapp/incentivo/disparar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threshold,
          cooldown,
          votante_ids: Array.from(selecionados),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha no disparo");
      setResultado({
        enviados: data.enviados,
        falhas: data.falhas,
        detalhes_falhas: data.detalhes_falhas ?? [],
        restantes: data.restantes ?? 0,
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

  // Dedup pra UI: 1 linha por votante, mostra a subcat mais acirrada
  const linhasUnicas = (() => {
    if (!elegiveis) return [];
    const map = new Map<string, Elegivel>();
    for (const e of elegiveis) {
      const atual = map.get(e.votante_id);
      if (!atual || e.diferenca < atual.diferenca) map.set(e.votante_id, e);
    }
    return Array.from(map.values()).sort((a, b) => a.diferenca - b.diferenca);
  })();

  return (
    <Card className="mt-6">
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <Send className="w-5 h-5 text-cdl-blue" />
          <h2 className="font-display text-xl font-bold text-cdl-blue">
            Disparo de incentivo
          </h2>
        </div>
        <p className="text-sm text-muted mb-4">
          Manda WhatsApp para quem votou no candidato que está perdendo (top 2)
          em subcategorias acirradas. 1 mensagem por pessoa, registrada para não
          repetir.
        </p>

        {stats && (
          <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-[rgba(10,42,94,0.12)] bg-cream-100 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted mb-0.5">
                <Inbox className="w-4 h-4 text-cdl-blue" />
                <span>Já receberam (acumulado)</span>
              </div>
              <div className="font-display text-2xl font-bold text-cdl-blue tabular-nums leading-none">
                {stats.ja_receberam.toLocaleString("pt-BR")}
              </div>
            </div>
            <div className="rounded-xl border border-[rgba(10,42,94,0.12)] bg-cream-100 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted mb-0.5">
                <Send className="w-4 h-4 text-cdl-green" />
                <span>Enviadas hoje</span>
              </div>
              <div className="font-display text-2xl font-bold text-cdl-blue tabular-nums leading-none">
                {stats.enviadas_hoje.toLocaleString("pt-BR")}
              </div>
            </div>
            <div className="rounded-xl border border-[rgba(10,42,94,0.12)] bg-cream-100 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted mb-0.5">
                <Clock className="w-4 h-4 text-cdl-blue" />
                <span>Última enviada</span>
              </div>
              <div className="font-display text-base font-bold text-cdl-blue tabular-nums leading-none mt-1">
                {stats.ultima_enviada ? formatDateTime(stats.ultima_enviada) : "—"}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-end gap-3 mb-4 flex-wrap">
          <div className="flex-1 max-w-[200px]">
            <label className="text-xs text-muted block mb-1">
              Diferença máxima (votos)
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number.parseInt(e.target.value || "0", 10))}
            />
          </div>
          <div className="flex-1 max-w-[200px]">
            <label className="text-xs text-muted block mb-1">
              Cooldown desde último voto (min)
            </label>
            <Input
              type="number"
              min={0}
              max={1440}
              value={cooldown}
              onChange={(e) => setCooldown(Number.parseInt(e.target.value || "0", 10))}
            />
          </div>
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
                <span className="text-red-700"> · {resultado.falhas} falhas</span>
              )}
              {resultado.restantes > 0 && (
                <div className="text-xs mt-1 text-amber-700">
                  ⚠ Limitado a 50 por disparo (pacing 2-5s). Sobraram{" "}
                  <strong>{resultado.restantes}</strong> — clique em &quot;Calcular elegíveis&quot; e dispare de novo pra essas.
                </div>
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
                {linhasUnicas.length} pessoa(s) elegível(eis) ·{" "}
                <strong>{selecionados.size}</strong> selecionada(s)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelecionados(new Set(linhasUnicas.map((e) => e.votante_id)))}
                >
                  Marcar todos
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

            <div className="max-h-[420px] overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {linhasUnicas.length === 0 && (
                <p className="text-center text-sm text-muted py-12">
                  Ninguém elegível com esse threshold.
                </p>
              )}
              {linhasUnicas.map((e) => {
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
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{e.votante_nome}</span>
                        <span className="text-xs text-muted">{e.whatsapp}</span>
                      </div>
                      <div className="text-xs text-muted truncate">
                        {e.categoria_nome} → {e.subcategoria_nome} · votou em{" "}
                        <strong>{e.candidato_perdendo_nome}</strong>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-muted">
                        {e.candidato_lider_nome}
                      </div>
                      <div className="text-sm font-semibold text-orange-600">
                        {e.diferenca === 0 ? "empate" : `−${e.diferenca}`}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="mt-4">
              <Button
                onClick={disparar}
                loading={loading === "disparar"}
                disabled={selecionados.size === 0}
                className="w-full sm:w-auto"
              >
                <Send className="w-4 h-4 mr-2" />
                Disparar para {selecionados.size} pessoa(s)
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
