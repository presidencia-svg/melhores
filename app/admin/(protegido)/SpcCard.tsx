"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { ShieldCheck, ShieldOff } from "lucide-react";

export function SpcCard() {
  const [ligado, setLigado] = useState<boolean | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/spc", { cache: "no-store" });
      if (res.ok) {
        const d = (await res.json()) as { ligado: boolean };
        setLigado(d.ligado);
      }
    } catch {
      // ignora
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternar() {
    if (ligado === null || salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/admin/spc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ligado: !ligado }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Falha ao salvar");
      } else {
        setLigado(data.ligado);
      }
    } catch {
      setErro("Erro de conexão");
    } finally {
      setSalvando(false);
    }
  }

  if (ligado === null) return null;

  const desligado = !ligado;

  return (
    <Card className="mb-6">
      <CardContent>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                desligado ? "bg-red-600/15" : "bg-green-600/15"
              }`}
            >
              {desligado ? (
                <ShieldOff className="w-5 h-5 text-red-700" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-green-700" />
              )}
            </div>
            <div>
              <h2 className="font-display-bold text-navy-800 text-lg leading-tight">
                Consulta SPC
              </h2>
              <p className="text-xs text-muted mt-1 max-w-md">
                {desligado ? (
                  <>
                    <strong className="text-red-700">DESLIGADO</strong> —
                    novos cadastros aceitam o nome digitado pelo votante
                    sem validar no SPC. Use só durante manutenção/queda do
                    SPC Brasil.
                  </>
                ) : (
                  <>
                    <strong className="text-green-700">LIGADO</strong> —
                    todo novo cadastro precisa do CPF validado na base
                    oficial do SPC. Default.
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={alternar}
            disabled={salvando}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              ligado ? "bg-green-600" : "bg-red-500"
            } ${salvando ? "opacity-50" : ""}`}
            aria-label={ligado ? "Desligar SPC" : "Ligar SPC"}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                ligado ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {erro && (
          <p className="mt-3 text-sm text-red-600 text-center">{erro}</p>
        )}
      </CardContent>
    </Card>
  );
}
