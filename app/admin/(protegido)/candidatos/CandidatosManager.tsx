"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Upload, FileText, UserPlus, Check, X } from "lucide-react";

type Sub = { id: string; nome: string; categoria: { nome: string } };

export function CandidatosManager({ subcategorias }: { subcategorias: Sub[] }) {
  const router = useRouter();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<{ inseridos: number; ignorados: number; erros: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  // Criar candidato individual
  const [novoSub, setNovoSub] = useState<string>("");
  const [novoNome, setNovoNome] = useState("");
  const [novaDesc, setNovaDesc] = useState("");
  const [novaFoto, setNovaFoto] = useState("");
  const [criando, setCriando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "erro"; msg: string } | null>(null);

  async function importar() {
    if (!arquivo) return;
    setLoading(true);
    setResultado(null);
    const fd = new FormData();
    fd.append("file", arquivo);
    const res = await fetch("/api/admin/candidatos/importar", { method: "POST", body: fd });
    const data = await res.json();
    setResultado(data);
    setLoading(false);
    if (data.inseridos > 0) router.refresh();
  }

  async function criarCandidato() {
    if (!novoSub || !novoNome.trim()) return;
    setCriando(true);
    setFeedback(null);
    const res = await fetch("/api/admin/candidatos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subcategoria_id: novoSub,
        nome: novoNome.trim(),
        descricao: novaDesc.trim() || null,
        foto_url: novaFoto.trim() || null,
      }),
    });
    const data = await res.json();
    setCriando(false);
    if (!res.ok) {
      setFeedback({ tipo: "erro", msg: data.error ?? "Falha ao criar" });
      return;
    }
    setFeedback({ tipo: "ok", msg: `Candidato "${novoNome.trim()}" criado.` });
    setNovoNome("");
    setNovaDesc("");
    setNovaFoto("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cdl-green/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-cdl-green" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-cdl-blue">Adicionar candidato individual</h2>
              <p className="text-sm text-muted">Criar um candidato sem precisar de CSV.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted block mb-1">Subcategoria</label>
              <select
                value={novoSub}
                onChange={(e) => setNovoSub(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[rgba(10,42,94,0.15)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cdl-blue/30"
              >
                <option value="">— escolha uma subcategoria —</option>
                {subcategorias.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.categoria.nome} → {s.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted block mb-1">Nome</label>
              <Input
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex.: Xereta Autos"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Descrição (opcional)</label>
              <Input
                value={novaDesc}
                onChange={(e) => setNovaDesc(e.target.value)}
                placeholder="curta — até 280 caracteres"
                maxLength={280}
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Foto (URL, opcional)</label>
              <Input
                value={novaFoto}
                onChange={(e) => setNovaFoto(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={criarCandidato}
              disabled={!novoSub || !novoNome.trim()}
              loading={criando}
            >
              <Check className="w-4 h-4 mr-1" /> Criar candidato
            </Button>
            {feedback && (
              <span
                className={`text-sm flex items-center gap-1 ${
                  feedback.tipo === "ok" ? "text-cdl-green-dark" : "text-red-600"
                }`}
              >
                {feedback.tipo === "ok" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                {feedback.msg}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cdl-blue/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-cdl-blue" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-cdl-blue">Importar candidatos via CSV</h2>
              <p className="text-sm text-muted">
                Formato esperado: <code className="bg-zinc-100 px-1 rounded">categoria,subcategoria,nome,descricao,foto_url</code>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-cdl-blue file:text-white hover:file:bg-cdl-blue-dark file:cursor-pointer cursor-pointer"
            />
            <Button onClick={importar} disabled={!arquivo} loading={loading}>
              Importar
            </Button>
          </div>

          {resultado && (
            <div className="mt-4 p-3 rounded-xl bg-cdl-green/10 border border-cdl-green/30 text-sm">
              <p className="font-semibold text-cdl-green-dark">
                ✓ {resultado.inseridos} candidatos inseridos
                {resultado.ignorados > 0 && ` · ${resultado.ignorados} ignorados`}
              </p>
              {resultado.erros.length > 0 && (
                <ul className="mt-2 text-xs text-muted list-disc pl-4">
                  {resultado.erros.slice(0, 5).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-muted mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">Subcategorias disponíveis ({subcategorias.length})</h3>
              <div className="grid sm:grid-cols-2 gap-1 text-xs text-muted max-h-64 overflow-y-auto">
                {subcategorias.map((s) => (
                  <div key={s.id} className="px-2 py-1 rounded bg-zinc-50">
                    <strong>{s.categoria.nome}</strong> → {s.nome}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
