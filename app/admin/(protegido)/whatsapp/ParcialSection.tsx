"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BarChart3, AlertCircle, Check } from "lucide-react";

type Elegivel = {
  votante_id: string;
  votante_nome: string;
  whatsapp: string;
};

const LOTE_MAX = 50;

export function ParcialSection() {
  const [loading, setLoading] = useState<"preview" | "disparar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [elegiveis, setElegiveis] = useState<Elegivel[] | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [resultado, setResultado] = useState<{
    enviados: number;
    falhas: number;
    detalhes_falhas: { nome: string; motivo: string }[];
  } | null>(null);

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

        <Button onClick={calcular} loading={loading === "preview"} className="mb-4">
          Calcular elegíveis
        </Button>

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
                      <span className="text-xs text-muted">{e.whatsapp}</span>
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
