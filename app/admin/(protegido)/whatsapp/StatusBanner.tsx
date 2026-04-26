"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

type Status = {
  conectado: boolean;
  detalhe?: string;
};

export function StatusBanner() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp/status");
      const data = await res.json();
      setStatus({ conectado: !!data.conectado, detalhe: data.detalhe });
    } catch {
      setStatus({ conectado: false, detalhe: "Falha ao consultar status" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  if (!status) {
    return (
      <div className="mt-6 mb-2 flex items-center gap-2 text-sm text-muted">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Verificando conexão Z-API…
      </div>
    );
  }

  if (status.conectado) {
    return (
      <div className="mt-6 mb-2 flex items-center justify-between gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>WhatsApp conectado · pronto para disparar</span>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-xs underline hover:no-underline"
        >
          {loading ? "verificando..." : "atualizar"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 mb-2 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1">
        <strong>WhatsApp desconectado.</strong> Os disparos vão falhar. Reconecte
        em <a href="https://app.z-api.io" target="_blank" rel="noopener noreferrer" className="underline">app.z-api.io</a>{" "}
        (escaneie o QR pelo WhatsApp do celular).
        {status.detalhe && (
          <div className="text-xs mt-1 opacity-80">Detalhe: {status.detalhe}</div>
        )}
      </div>
      <button
        onClick={refresh}
        disabled={loading}
        className="text-xs underline hover:no-underline shrink-0"
      >
        {loading ? "verificando..." : "atualizar"}
      </button>
    </div>
  );
}
