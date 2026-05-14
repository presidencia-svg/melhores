"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Loader2, Ticket, CheckCircle2 } from "lucide-react";

function formatarReais(centavos: number): string {
  return `R$ ${(centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function AplicarCupom() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<{ valor: number; saldo: number } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    if (codigo.trim().length < 3) {
      setErro("Digite o código do cupom");
      return;
    }
    setCarregando(true);
    try {
      const res = await fetch("/api/admin/cupons/resgatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigo.trim() }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        valor_creditado_centavos?: number;
        saldo_atual?: number;
      };
      if (!res.ok) {
        setErro(json.error ?? "Falha");
        return;
      }
      setSucesso({
        valor: json.valor_creditado_centavos ?? 0,
        saldo: json.saldo_atual ?? 0,
      });
      setCodigo("");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <Ticket className="w-5 h-5 text-cdl-blue/70" />
          <h2 className="font-display text-lg font-bold text-cdl-blue">
            Aplicar cupom
          </h2>
        </div>
        <p className="text-xs text-muted mb-3">
          Tem um código promocional? Resgate aqui e o valor entra direto no
          saldo da carteira.
        </p>

        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
          <input
            value={codigo}
            onChange={(e) =>
              setCodigo(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9_-]/g, "")
                  .slice(0, 40)
              )
            }
            placeholder="DIGITE-O-CODIGO"
            className="flex-1 h-11 rounded-md border border-border bg-white px-3 font-mono uppercase tracking-wider"
            disabled={carregando}
          />
          <button
            type="submit"
            disabled={carregando || codigo.length < 3}
            className="h-11 inline-flex items-center justify-center gap-2 px-6 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark disabled:opacity-50"
          >
            {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Resgatar
          </button>
        </form>

        {erro && (
          <p className="mt-3 text-sm text-red-600 font-medium">⚠ {erro}</p>
        )}
        {sucesso && (
          <div className="mt-3 rounded-lg bg-cdl-green/10 border border-cdl-green/30 p-3 flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-cdl-green-dark shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-cdl-green-dark">
                Cupom resgatado! +{formatarReais(sucesso.valor)} creditados.
              </p>
              <p className="text-xs text-cdl-green-dark/80 mt-1">
                Saldo atual:{" "}
                <strong className="font-mono">
                  {formatarReais(sucesso.saldo)}
                </strong>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
