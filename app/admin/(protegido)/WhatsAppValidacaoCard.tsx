"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { MessageSquare, MessageSquareOff } from "lucide-react";

export function WhatsAppValidacaoCard() {
  const [ligada, setLigada] = useState<boolean | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp-validacao", { cache: "no-store" });
      if (res.ok) {
        const d = (await res.json()) as { ligada: boolean };
        setLigada(d.ligada);
      }
    } catch {
      // ignora
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternar() {
    if (ligada === null || salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/admin/whatsapp-validacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ligada: !ligada }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Falha ao salvar");
      } else {
        setLigada(data.ligada);
      }
    } catch {
      setErro("Erro de conexão");
    } finally {
      setSalvando(false);
    }
  }

  if (ligada === null) return null;

  const desligada = !ligada;

  return (
    <Card className="mb-6">
      <CardContent>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                desligada ? "bg-red-600/15" : "bg-green-600/15"
              }`}
            >
              {desligada ? (
                <MessageSquareOff className="w-5 h-5 text-red-700" />
              ) : (
                <MessageSquare className="w-5 h-5 text-green-700" />
              )}
            </div>
            <div>
              <h2 className="font-display-bold text-navy-800 text-lg leading-tight">
                Validação WhatsApp (OTP)
              </h2>
              <p className="text-xs text-muted mt-1 max-w-md">
                {desligada ? (
                  <>
                    <strong className="text-red-700">DESLIGADA</strong> — o
                    fluxo do votante pula direto pra obrigado, sem coletar
                    nem validar WhatsApp. Nenhum OTP é enviado (sem custo
                    Meta/Z-API/SMS). Use só durante problema de
                    pagamento ou queda do WABA.
                  </>
                ) : (
                  <>
                    <strong className="text-green-700">LIGADA</strong> — o
                    votante recebe OTP no WhatsApp pra confirmar. Default.
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={alternar}
            disabled={salvando}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              ligada ? "bg-green-600" : "bg-red-500"
            } ${salvando ? "opacity-50" : ""}`}
            aria-label={ligada ? "Desligar validação" : "Ligar validação"}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                ligada ? "translate-x-6" : "translate-x-1"
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
