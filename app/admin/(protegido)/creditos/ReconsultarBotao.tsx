"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

export function ReconsultarBotao({ pagamentoId }: { pagamentoId: string }) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reconsultar() {
    setMsg(null);
    setCarregando(true);
    try {
      const res = await fetch(
        `/api/admin/creditos/reconsultar/${pagamentoId}`,
        { method: "POST" }
      );
      const data = (await res.json()) as {
        ok?: boolean;
        status?: string;
        creditado?: boolean;
        ja_processado?: boolean;
        ainda_pendente?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setMsg(`⚠ ${data.error ?? "Falhou"}`);
        return;
      }
      if (data.creditado) {
        setMsg("✓ Aprovado e creditado");
      } else if (data.ja_processado) {
        setMsg("✓ Já estava pago");
      } else if (data.ainda_pendente) {
        setMsg(`⏳ MP responde "${data.status}" — ainda aguardando`);
      } else if (data.status === "cancelado") {
        setMsg("× Cancelado pelo MP");
      } else {
        setMsg(`Status MP: ${data.status}`);
      }
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? `⚠ ${e.message}` : "⚠ Falha de rede");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={reconsultar}
        disabled={carregando}
        title="Forçar consulta ao Mercado Pago"
        className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded border border-cdl-blue/30 text-cdl-blue hover:bg-cdl-blue/5 disabled:opacity-50"
      >
        {carregando ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <RefreshCw className="w-3 h-3" />
        )}
        Reconsultar
      </button>
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </div>
  );
}
