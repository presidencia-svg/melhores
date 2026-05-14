"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { UserPlus, UserX } from "lucide-react";

export function SugestoesPublicasCard() {
  const [ligadas, setLigadas] = useState<boolean | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sugestoes-publicas", { cache: "no-store" });
      if (res.ok) {
        const d = (await res.json()) as { ligadas: boolean };
        setLigadas(d.ligadas);
      }
    } catch {
      // ignora
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternar() {
    if (ligadas === null || salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/admin/sugestoes-publicas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ligadas: !ligadas }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Falha ao salvar");
      } else {
        setLigadas(data.ligadas);
      }
    } catch {
      setErro("Erro de conexão");
    } finally {
      setSalvando(false);
    }
  }

  if (ligadas === null) return null;

  const desligadas = !ligadas;

  return (
    <Card className="mb-6">
      <CardContent>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                desligadas ? "bg-red-600/15" : "bg-green-600/15"
              }`}
            >
              {desligadas ? (
                <UserX className="w-5 h-5 text-red-700" />
              ) : (
                <UserPlus className="w-5 h-5 text-green-700" />
              )}
            </div>
            <div>
              <h2 className="font-display-bold text-navy-800 text-lg leading-tight">
                Sugestão pública de candidato
              </h2>
              <p className="text-xs text-muted mt-1 max-w-md">
                {desligadas ? (
                  <>
                    <strong className="text-red-700">DESLIGADA</strong> — o
                    votante só escolhe entre os candidatos já cadastrados. O
                    botão &ldquo;Sugerir&rdquo; some da tela de votação. Use
                    pra campanha 100% curada ou pra travar a lista na reta
                    final.
                  </>
                ) : (
                  <>
                    <strong className="text-green-700">LIGADA</strong> — o
                    votante pode sugerir um candidato novo na hora de votar.
                    Default.
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={alternar}
            disabled={salvando}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              ligadas ? "bg-green-600" : "bg-red-500"
            } ${salvando ? "opacity-50" : ""}`}
            aria-label={ligadas ? "Desligar sugestões" : "Ligar sugestões"}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                ligadas ? "translate-x-6" : "translate-x-1"
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
