"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

type CanalAtivo = "meta" | "zapi" | "sms" | null;

type Status = {
  meta: { configurada: boolean; conectada: boolean; detalhe?: string; phone_ids: string[] };
  zapi: { conectado: boolean; detalhe?: string };
  sms: { configurada: boolean };
  canal_ativo: CanalAtivo;
};

const ROTULOS: Record<Exclude<CanalAtivo, null>, string> = {
  meta: "WhatsApp Cloud (Meta)",
  zapi: "Z-API (não-oficial)",
  sms: "SMS via Zenvia",
};

export function StatusBanner() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp/status");
      const data = (await res.json()) as Status;
      setStatus(data);
    } catch {
      setStatus(null);
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
        Verificando canais de envio…
      </div>
    );
  }

  const canalAtivo = status.canal_ativo;

  if (canalAtivo) {
    const rotulo = ROTULOS[canalAtivo];
    const phoneCount = status.meta.phone_ids.length;
    return (
      <div className="mt-6 mb-2 flex items-start justify-between gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <strong>Canal ativo: {rotulo}</strong>
            {canalAtivo === "meta" && phoneCount > 0 && (
              <span className="block text-xs mt-0.5">
                {phoneCount} número(s) Meta em round-robin.
              </span>
            )}
            <span className="block text-xs mt-0.5 opacity-70">
              Meta: {status.meta.conectada ? "✓" : status.meta.configurada ? "configurado mas off" : "não configurado"} ·
              Z-API: {status.zapi.conectado ? "✓" : "off"} ·
              SMS: {status.sms.configurada ? "✓ disponível" : "não configurado"}
            </span>
          </div>
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

  return (
    <div className="mt-6 mb-2 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1">
        <strong>Nenhum canal disponível.</strong> Os disparos vão falhar até você:
        <ul className="text-xs mt-1 list-disc list-inside">
          <li>Configurar Meta WhatsApp (token + phone IDs no Vercel), <strong>ou</strong></li>
          <li>Reconectar a Z-API em <a href="https://app.z-api.io" target="_blank" rel="noopener noreferrer" className="underline">app.z-api.io</a>, <strong>ou</strong></li>
          <li>Configurar Zenvia SMS (ZENVIA_API_TOKEN + ZENVIA_FROM)</li>
        </ul>
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
