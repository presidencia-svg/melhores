"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Tipo = "multi_tenant_1x_cada" | "uso_unico_global" | "multi_uso_livre";

const TIPOS: { v: Tipo; label: string; descr: string }[] = [
  {
    v: "multi_tenant_1x_cada",
    label: "Multi-tenant (cada usa 1x)",
    descr: "Vários tenants resgatam, mas cada um só 1 vez. Bom pra campanha de marketing geral (ex: BEMVINDO500).",
  },
  {
    v: "uso_unico_global",
    label: "Uso único global",
    descr: "Apenas o primeiro tenant que digitar resgata. Bom pra cortesia individual nominal.",
  },
  {
    v: "multi_uso_livre",
    label: "Multi-uso livre",
    descr: "Mesmo tenant pode resgatar várias vezes. Use com cuidado.",
  },
];

export function CupomForm() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [valorReais, setValorReais] = useState("");
  const [tipo, setTipo] = useState<Tipo>("multi_tenant_1x_cada");
  const [comExpira, setComExpira] = useState(false);
  const [expiraEm, setExpiraEm] = useState("");
  const [comMaxUsos, setComMaxUsos] = useState(false);
  const [maxUsos, setMaxUsos] = useState("");
  const [descricao, setDescricao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setOk(null);

    const reais = parseFloat(valorReais.replace(",", "."));
    if (!reais || reais <= 0) {
      setErro("Valor inválido");
      return;
    }

    if (comExpira && !expiraEm) {
      setErro("Defina a data de expiração ou desligue a opção");
      return;
    }
    if (comMaxUsos && (!maxUsos || parseInt(maxUsos, 10) <= 0)) {
      setErro("Defina o limite de usos ou desligue a opção");
      return;
    }

    setCarregando(true);
    try {
      const res = await fetch("/api/super/cupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: codigo.trim(),
          valor_centavos: Math.round(reais * 100),
          tipo,
          expira_em: comExpira ? new Date(expiraEm).toISOString() : null,
          max_usos: comMaxUsos ? parseInt(maxUsos, 10) : null,
          descricao: descricao.trim() || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        codigo?: string;
      };
      if (!res.ok) {
        setErro(json.error ?? "Falha");
        return;
      }
      setOk(`Cupom ${json.codigo} criado!`);
      setCodigo("");
      setValorReais("");
      setExpiraEm("");
      setMaxUsos("");
      setDescricao("");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm font-medium text-cdl-blue">
          Código
          <input
            required
            value={codigo}
            onChange={(e) =>
              setCodigo(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9_-]/g, "")
                  .slice(0, 40)
              )
            }
            placeholder="BEMVINDO500"
            className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3 font-mono uppercase"
            disabled={carregando}
          />
        </label>
        <label className="text-sm font-medium text-cdl-blue">
          Valor em créditos (R$)
          <input
            required
            type="text"
            inputMode="decimal"
            value={valorReais}
            onChange={(e) => setValorReais(e.target.value)}
            placeholder="500,00"
            className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3 font-mono"
            disabled={carregando}
          />
        </label>
      </div>

      <div>
        <p className="text-sm font-medium text-cdl-blue mb-2">Tipo de uso</p>
        <div className="grid sm:grid-cols-3 gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => setTipo(t.v)}
              className={`text-left p-3 rounded-lg border-2 transition-colors ${
                tipo === t.v
                  ? "border-cdl-blue bg-cdl-blue/5"
                  : "border-border hover:border-cdl-blue/50"
              }`}
            >
              <p className="text-sm font-medium text-cdl-blue mb-1">{t.label}</p>
              <p className="text-xs text-muted leading-snug">{t.descr}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border p-3">
          <label className="text-sm font-medium text-cdl-blue inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={comExpira}
              onChange={(e) => setComExpira(e.target.checked)}
              disabled={carregando}
            />
            Definir validade
          </label>
          {comExpira && (
            <input
              type="datetime-local"
              value={expiraEm}
              onChange={(e) => setExpiraEm(e.target.value)}
              className="mt-2 w-full h-10 rounded-md border border-border bg-white px-3"
              disabled={carregando}
            />
          )}
        </div>

        <div className="rounded-lg border border-border p-3">
          <label className="text-sm font-medium text-cdl-blue inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={comMaxUsos}
              onChange={(e) => setComMaxUsos(e.target.checked)}
              disabled={carregando}
            />
            Limitar quantidade de usos
          </label>
          {comMaxUsos && (
            <input
              type="number"
              min={1}
              value={maxUsos}
              onChange={(e) => setMaxUsos(e.target.value)}
              placeholder="10"
              className="mt-2 w-full h-10 rounded-md border border-border bg-white px-3 font-mono"
              disabled={carregando}
            />
          )}
        </div>
      </div>

      <label className="text-sm font-medium text-cdl-blue">
        Descrição (opcional)
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Cortesia lançamento Aracaju"
          maxLength={200}
          className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3"
          disabled={carregando}
        />
      </label>

      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {ok && <p className="text-sm text-cdl-green-dark">✓ {ok}</p>}

      <button
        type="submit"
        disabled={carregando}
        className="h-11 self-start inline-flex items-center gap-2 px-6 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark disabled:opacity-50"
      >
        {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Criar cupom
      </button>
    </form>
  );
}
