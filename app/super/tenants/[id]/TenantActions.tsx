"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function CortesiaForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setOk(false);
    const reais = parseFloat(valor.replace(",", "."));
    if (!reais || reais <= 0) {
      setErro("Valor inválido");
      return;
    }
    const centavos = Math.round(reais * 100);
    setCarregando(true);
    try {
      const res = await fetch("/api/super/cortesia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          valor_centavos: centavos,
          descricao: descricao || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErro(json.error ?? "Falha");
        return;
      }
      setOk(true);
      setValor("");
      setDescricao("");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm font-medium text-cdl-blue">
          Valor (R$)
          <input
            type="text"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="100,00"
            className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3 font-mono"
            disabled={carregando}
          />
        </label>
        <label className="text-sm font-medium text-cdl-blue">
          Descrição (opcional)
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Cortesia campanha de teste"
            maxLength={200}
            className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3"
            disabled={carregando}
          />
        </label>
      </div>
      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}
      {ok ? (
        <p className="text-sm text-cdl-green-dark">✓ Crédito adicionado</p>
      ) : null}
      <button
        type="submit"
        disabled={carregando}
        className="h-10 self-start inline-flex items-center px-6 gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark disabled:opacity-50"
      >
        {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Adicionar crédito
      </button>
    </form>
  );
}

export function BloquearButton({
  tenantId,
  ativo,
}: {
  tenantId: string;
  ativo: boolean;
}) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  async function toggle() {
    if (
      !confirm(
        ativo
          ? "Bloquear esse tenant? Login admin vai parar de funcionar."
          : "Reativar esse tenant?"
      )
    )
      return;
    setCarregando(true);
    try {
      await fetch("/api/super/bloquear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, ativo: !ativo }),
      });
      router.refresh();
    } finally {
      setCarregando(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={carregando}
      className={`h-10 px-4 inline-flex items-center gap-2 rounded-md font-medium ${
        ativo
          ? "border border-red-300 text-red-700 hover:bg-red-50"
          : "bg-cdl-green text-white hover:bg-cdl-green-dark"
      }`}
    >
      {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      {ativo ? "Bloquear tenant" : "Reativar tenant"}
    </button>
  );
}
