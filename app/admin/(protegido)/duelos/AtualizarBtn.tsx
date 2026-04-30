"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";

export function AtualizarBtn() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feitoEm, setFeitoEm] = useState<Date | null>(null);

  function atualizar() {
    startTransition(() => {
      router.refresh();
      setFeitoEm(new Date());
    });
  }

  return (
    <button
      onClick={atualizar}
      disabled={isPending}
      className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-cdl-blue text-white text-sm font-medium hover:bg-cdl-blue-dark transition-colors disabled:opacity-50"
      title={feitoEm ? `Atualizado às ${feitoEm.toLocaleTimeString("pt-BR")}` : undefined}
    >
      <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Atualizando…" : "Atualizar"}
    </button>
  );
}
