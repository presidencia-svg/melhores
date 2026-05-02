"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Clock, Pencil, Check, X } from "lucide-react";

type Props = {
  fimVotacao: string;  // ISO timestamp
  divulgacaoResultado: string | null;
  edicaoNome: string;
};

// Converte ISO UTC pra valor de <input type="datetime-local"> no fuso Maceio.
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Maceio",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  // sv-SE produz "YYYY-MM-DD HH:MM" — datetime-local quer "YYYY-MM-DDTHH:MM"
  return fmt.format(d).replace(" ", "T");
}

// Converte valor do datetime-local (sem timezone) interpretando como Maceio (UTC-3).
// America/Maceio nao tem DST, sempre -03:00.
function localInputToIso(local: string): string {
  return `${local}:00-03:00`;
}

function formatHumano(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Maceio",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EncerramentoCard({
  fimVotacao,
  divulgacaoResultado,
  edicaoNome,
}: Props) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [valorFim, setValorFim] = useState(() => isoToLocalInput(fimVotacao));
  const [valorDivulg, setValorDivulg] = useState(() =>
    divulgacaoResultado ? isoToLocalInput(divulgacaoResultado) : ""
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const fimFormatado = formatHumano(fimVotacao);
  const divulgFormatado = divulgacaoResultado
    ? formatHumano(divulgacaoResultado)
    : null;
  const expirado = Date.now() > new Date(fimVotacao).getTime();

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const isoFim = new Date(localInputToIso(valorFim)).toISOString();
      const isoDivulg = valorDivulg
        ? new Date(localInputToIso(valorDivulg)).toISOString()
        : null;
      const res = await fetch("/api/admin/edicao", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fim_votacao: isoFim,
          divulgacao_resultado: isoDivulg,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Falha ao salvar");
      } else {
        setEditando(false);
        router.refresh();
      }
    } catch {
      setErro("Erro de conexão");
    } finally {
      setSalvando(false);
    }
  }

  function cancelar() {
    setValorFim(isoToLocalInput(fimVotacao));
    setValorDivulg(
      divulgacaoResultado ? isoToLocalInput(divulgacaoResultado) : ""
    );
    setEditando(false);
    setErro(null);
  }

  return (
    <Card className="mb-6">
      <CardContent>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                expirado ? "bg-red-600/15" : "bg-cdl-blue/10"
              }`}
            >
              <Clock
                className={`w-5 h-5 ${expirado ? "text-red-700" : "text-cdl-blue"}`}
              />
            </div>
            <div>
              <h2 className="font-display-bold text-navy-800 text-lg leading-tight">
                Encerramento da votação
              </h2>
              <p className="text-xs text-muted mt-1 max-w-md">
                Quando essa data passa, qualquer pessoa que acessar{" "}
                <code className="bg-cream-200 px-1 rounded">/votar</code> vê a
                tela de "Votação encerrada" e o sistema bloqueia novos votos
                automaticamente. {edicaoNome}.
              </p>
              {expirado && (
                <p className="text-xs text-red-600 font-semibold mt-1">
                  ⚠ Já expirou — votação está bloqueada agora
                </p>
              )}
            </div>
          </div>

          {!editando && (
            <button
              onClick={() => setEditando(true)}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-cdl-blue text-white text-xs font-medium hover:bg-cdl-blue-dark transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
          )}
        </div>

        {!editando ? (
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <div>
              <p className="kicker text-muted" style={{ fontSize: 9 }}>
                encerramento da votação
              </p>
              <p className="font-display text-xl text-navy-800 mt-0.5">
                {fimFormatado}
              </p>
            </div>
            <div>
              <p className="kicker text-muted" style={{ fontSize: 9 }}>
                divulgação do resultado
              </p>
              <p className="font-display text-xl text-navy-800 mt-0.5">
                {divulgFormatado ?? (
                  <span className="text-muted text-sm font-sans italic">
                    não definida
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="kicker text-muted block mb-1" style={{ fontSize: 9 }}>
                encerramento da votação
              </span>
              <input
                type="datetime-local"
                value={valorFim}
                onChange={(e) => setValorFim(e.target.value)}
                disabled={salvando}
                className="w-full h-10 px-3 rounded-lg border border-[rgba(10,42,94,0.2)] bg-white text-sm text-navy-800 focus:border-cdl-blue focus:outline-none focus:ring-1 focus:ring-cdl-blue disabled:opacity-50"
              />
            </label>
            <label className="text-sm">
              <span className="kicker text-muted block mb-1" style={{ fontSize: 9 }}>
                divulgação do resultado
              </span>
              <input
                type="datetime-local"
                value={valorDivulg}
                onChange={(e) => setValorDivulg(e.target.value)}
                disabled={salvando}
                className="w-full h-10 px-3 rounded-lg border border-[rgba(10,42,94,0.2)] bg-white text-sm text-navy-800 focus:border-cdl-blue focus:outline-none focus:ring-1 focus:ring-cdl-blue disabled:opacity-50"
              />
            </label>
            <div className="flex gap-2 sm:col-span-2 justify-end">
              <span className="text-xs text-muted self-center mr-auto">
                ambos em horário Nordeste
              </span>
              <button
                onClick={cancelar}
                disabled={salvando}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[rgba(10,42,94,0.2)] text-navy-800 text-xs font-medium hover:bg-cream-200 transition-colors disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-cdl-green text-white text-xs font-medium hover:bg-cdl-green-dark transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {salvando ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        )}

        {erro && (
          <p className="text-sm text-red-600 mt-2">{erro}</p>
        )}
      </CardContent>
    </Card>
  );
}
