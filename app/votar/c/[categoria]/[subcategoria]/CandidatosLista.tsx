"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, Plus, Check } from "lucide-react";

type Candidato = {
  id: string;
  nome: string;
  descricao: string | null;
  foto_url: string | null;
};

type Props = {
  subcategoriaId: string;
  candidatos: Candidato[];
  votoAtual: string | null;
};

export function CandidatosLista({ subcategoriaId, candidatos, votoAtual }: Props) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<string | null>(votoAtual);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSugestao, setShowSugestao] = useState(false);
  const [novoNome, setNovoNome] = useState("");

  const filtrados = useMemo(() => {
    if (!busca) return candidatos;
    const termo = busca.toLowerCase();
    return candidatos.filter((c) => c.nome.toLowerCase().includes(termo));
  }, [busca, candidatos]);

  async function votar() {
    if (!selecionado) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/voto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subcategoriaId, candidatoId: selecionado }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Falha ao registrar voto");
        setSubmitting(false);
        return;
      }
      router.push("/votar/categorias");
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setSubmitting(false);
    }
  }

  async function sugerir() {
    if (!novoNome.trim() || novoNome.trim().length < 3) {
      setError("Nome muito curto");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sugerir-candidato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subcategoriaId, nome: novoNome.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Falha ao sugerir candidato");
        setSubmitting(false);
        return;
      }

      // Resposta inclui candidatoId (existente ou novo) — registra voto direto
      const votoRes = await fetch("/api/voto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subcategoriaId, candidatoId: data.candidatoId }),
      });
      if (!votoRes.ok) {
        const errData = await votoRes.json().catch(() => ({}));
        setError(errData.error ?? "Falha ao registrar voto");
        setSubmitting(false);
        return;
      }
      router.push("/votar/categorias");
    } catch {
      setError("Erro ao sugerir. Tente novamente.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        name="busca"
        placeholder="Buscar candidato..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="!h-11"
      />

      <div className="max-h-[420px] overflow-y-auto pr-1 -mr-1 flex flex-col gap-2">
        {filtrados.length === 0 && busca && (
          <div className="p-6 text-center text-muted text-sm">
            Nenhum candidato encontrado para “{busca}”.
            <br />
            <button
              onClick={() => {
                setShowSugestao(true);
                setNovoNome(busca);
              }}
              className="mt-3 inline-flex items-center gap-1 text-cdl-blue font-semibold hover:underline"
            >
              <Plus className="w-4 h-4" /> Sugerir “{busca}”
            </button>
          </div>
        )}

        {filtrados.map((c) => {
          const sel = selecionado === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelecionado(c.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                sel
                  ? "border-cdl-blue bg-cdl-blue/5 ring-2 ring-cdl-blue/20"
                  : "border-border hover:border-cdl-blue/50 hover:bg-cdl-blue/5"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                  sel ? "border-cdl-blue bg-cdl-blue" : "border-border"
                }`}
              >
                {sel && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{c.nome}</div>
              </div>
            </button>
          );
        })}
      </div>

      {!showSugestao && filtrados.length > 0 && (
        <button
          onClick={() => setShowSugestao(true)}
          className="text-sm text-cdl-blue hover:underline self-start inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Não encontrei meu candidato
        </button>
      )}

      {showSugestao && (
        <div className="rounded-xl border-2 border-dashed border-cdl-blue/30 p-4 bg-cdl-blue/5">
          <p className="text-sm font-medium text-cdl-blue mb-2">Sugerir um candidato</p>
          <Input
            name="novoNome"
            placeholder="Nome do candidato"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            className="!h-11"
          />
          <div className="flex gap-2 mt-3">
            <Button variant="ghost" size="sm" onClick={() => setShowSugestao(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={sugerir} loading={submitting}>
              Sugerir e votar
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      {!showSugestao && (
        <Button onClick={votar} disabled={!selecionado} loading={submitting} size="lg">
          Confirmar voto
        </Button>
      )}
    </div>
  );
}
