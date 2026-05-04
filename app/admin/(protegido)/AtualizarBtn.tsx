"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { revalidarRota } from "./_actions/revalidar";

// Botao "Atualizar" que invalida o cache da rota e refaz a busca dos dados.
// Usado nas paginas com revalidate alto (1h) pra que o admin possa forcar
// dados frescos sob demanda — ex: depois de uma mesclagem manual no SQL.
//
// Se `path` for omitido, faz so router.refresh (rerender client-side, sem
// invalidar cache do servidor — util pra rotas dynamic puras tipo duelos).
export function AtualizarBtn({ path }: { path?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feitoEm, setFeitoEm] = useState<Date | null>(null);

  function atualizar() {
    startTransition(async () => {
      if (path) await revalidarRota(path);
      router.refresh();
      setFeitoEm(new Date());
    });
  }

  return (
    <button
      onClick={atualizar}
      disabled={isPending}
      className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-cdl-blue text-white text-sm font-medium hover:bg-cdl-blue-dark transition-colors disabled:opacity-50"
      title={
        feitoEm
          ? `Atualizado às ${feitoEm.toLocaleTimeString("pt-BR")}`
          : path
            ? `Invalida o cache de ${path}`
            : undefined
      }
    >
      <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Atualizando…" : "Atualizar"}
    </button>
  );
}
