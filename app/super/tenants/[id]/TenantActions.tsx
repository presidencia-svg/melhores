"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

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

export function DeletarTenantCard({
  tenantId,
  slug,
  nome,
}: {
  tenantId: string;
  slug: string;
  nome: string;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function deletar() {
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/super/deletar-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          confirmacao_slug: confirmacao,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
        apagados?: {
          votos: number;
          votantes: number;
          candidatos: number;
          edicoes: number;
        };
      };
      if (!res.ok) {
        setErro(json.error ?? "Falha");
        return;
      }
      // Volta pra listagem com flash basico
      const a = json.apagados;
      alert(
        `Tenant "${nome}" deletado.\n` +
          (a
            ? `Apagados: ${a.edicoes} edição(ões), ${a.candidatos} candidatos, ${a.votantes} votantes, ${a.votos} votos.`
            : "")
      );
      router.push("/super");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setCarregando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-red-300 text-red-700 font-medium hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4" />
        Deletar tenant
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border-2 border-red-300 bg-red-50">
      <div>
        <p className="font-bold text-red-900 text-sm">
          Confirmar exclusão definitiva
        </p>
        <p className="text-xs text-red-800 mt-1 leading-relaxed">
          Apaga edições, categorias, candidatos, votantes, votos, créditos,
          pagamentos e configurações desse tenant. <strong>Não tem volta.</strong>{" "}
          Arquivos de logo/selfies no Storage não são apagados (limpe manual
          se quiser).
        </p>
      </div>

      <label className="text-xs font-medium text-red-900">
        Pra confirmar, digite exatamente o slug:{" "}
        <code className="bg-white px-1 rounded">{slug}</code>
        <input
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          className="mt-1 w-full h-10 rounded-md border border-red-300 bg-white px-3 font-mono"
          disabled={carregando}
          placeholder={slug}
        />
      </label>

      {erro && <p className="text-sm text-red-700">{erro}</p>}

      <div className="flex gap-2">
        <button
          onClick={deletar}
          disabled={carregando || confirmacao !== slug}
          className="h-10 inline-flex items-center gap-2 px-4 rounded-md bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <Trash2 className="w-4 h-4" />
          )}
          Deletar definitivamente
        </button>
        <button
          onClick={() => {
            setAberto(false);
            setConfirmacao("");
            setErro(null);
          }}
          disabled={carregando}
          className="h-10 px-4 rounded-md border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-50"
        >
          Cancelar
        </button>
      </div>
    </div>
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
