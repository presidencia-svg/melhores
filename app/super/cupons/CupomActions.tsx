"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Power, PowerOff, Trash2 } from "lucide-react";

export function CupomActions({
  id,
  ativo,
  podeDeletar,
}: {
  id: string;
  ativo: boolean;
  podeDeletar: boolean;
}) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  async function alternar() {
    setCarregando(true);
    try {
      await fetch(`/api/super/cupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !ativo }),
      });
      router.refresh();
    } finally {
      setCarregando(false);
    }
  }

  async function deletar() {
    if (!confirm("Deletar este cupom? Só funciona se ele nunca foi resgatado.")) return;
    setCarregando(true);
    try {
      const res = await fetch(`/api/super/cupons/${id}`, { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        alert(json.error ?? "Falha ao deletar");
        return;
      }
      router.refresh();
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={alternar}
        disabled={carregando}
        title={ativo ? "Desativar" : "Reativar"}
        className={`h-9 px-3 inline-flex items-center gap-1 rounded-md text-xs font-medium ${
          ativo
            ? "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
            : "bg-cdl-green text-white hover:bg-cdl-green-dark"
        }`}
      >
        {carregando ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : ativo ? (
          <PowerOff className="w-3 h-3" />
        ) : (
          <Power className="w-3 h-3" />
        )}
        {ativo ? "Desativar" : "Reativar"}
      </button>
      {podeDeletar && (
        <button
          onClick={deletar}
          disabled={carregando}
          title="Deletar"
          className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-red-300 text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
