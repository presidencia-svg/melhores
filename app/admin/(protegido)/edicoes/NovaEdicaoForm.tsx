"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Loader2, Plus } from "lucide-react";

export function NovaEdicaoForm({
  tenantNome,
  anoSugerido,
  anosUsados,
}: {
  tenantNome: string;
  anoSugerido: number;
  anosUsados: number[];
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [ano, setAno] = useState<number>(anoSugerido);
  const [nome, setNome] = useState<string>(
    `Melhores do Ano ${tenantNome} ${anoSugerido}`
  );
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function setAnoESugereNome(novoAno: number) {
    setAno(novoAno);
    if (nome.endsWith(String(ano))) {
      setNome(nome.replace(String(ano), String(novoAno)));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (anosUsados.includes(ano)) {
      setErro(`Já existe edição ${ano}`);
      return;
    }
    if (!inicio || !fim) {
      setErro("Defina início e fim da votação");
      return;
    }
    setCarregando(true);
    try {
      const res = await fetch("/api/admin/onboarding/edicao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ano,
          nome,
          inicio_votacao: new Date(inicio).toISOString(),
          fim_votacao: new Date(fim).toISOString(),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErro(json.error ?? "Falha ao criar");
        return;
      }
      setAberto(false);
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
        className="w-full sm:w-auto h-11 inline-flex items-center justify-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark px-6"
      >
        <Plus className="w-4 h-4" />
        Nova edição
      </button>
    );
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-cdl-blue">
                Nova edição
              </h2>
              <p className="text-xs text-muted mt-1">
                Ao criar, esta edição vira a ativa e as anteriores são
                arquivadas. Cobra a taxa de campanha (R$ 500) se houver
                saldo — sem saldo, fica pendente e cria mesmo assim.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="text-xs text-muted hover:text-foreground"
            >
              Cancelar
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="text-sm font-medium text-cdl-blue">
              Ano
              <input
                required
                type="number"
                value={ano}
                onChange={(e) =>
                  setAnoESugereNome(parseInt(e.target.value, 10) || anoSugerido)
                }
                min={2024}
                max={2100}
                className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3 font-mono"
                disabled={carregando}
              />
            </label>
            <label className="text-sm font-medium text-cdl-blue sm:col-span-2">
              Nome da edição
              <input
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={120}
                className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3"
                disabled={carregando}
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm font-medium text-cdl-blue">
              Início da votação
              <input
                required
                type="datetime-local"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3"
                disabled={carregando}
              />
            </label>
            <label className="text-sm font-medium text-cdl-blue">
              Fim da votação
              <input
                required
                type="datetime-local"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3"
                disabled={carregando}
              />
            </label>
          </div>

          {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

          <button
            type="submit"
            disabled={carregando}
            className="h-11 self-start inline-flex items-center justify-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark disabled:opacity-50 px-6"
          >
            {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Criar edição
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
