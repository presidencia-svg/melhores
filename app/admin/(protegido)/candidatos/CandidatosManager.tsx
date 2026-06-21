"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Upload, FileText, UserPlus, Check, X, AlertTriangle, FolderTree, Download } from "lucide-react";

type Sub = { id: string; nome: string; categoria: { nome: string } };

export function CandidatosManager({ subcategorias }: { subcategorias: Sub[] }) {
  const semSubcategorias = subcategorias.length === 0;

  const router = useRouter();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<{
    inseridos: number;
    ignorados: number;
    categoriasCriadas?: number;
    subcategoriasCriadas?: number;
    erros: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Criar candidato individual
  const [novoSub, setNovoSub] = useState<string>("");
  const [novoNome, setNovoNome] = useState("");
  const [novaDesc, setNovaDesc] = useState("");
  const [novaFoto, setNovaFoto] = useState("");
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [erroUpload, setErroUpload] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "erro"; msg: string } | null>(null);

  async function uploadFoto(file: File) {
    setErroUpload(null);
    setUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append("foto", file);
      const res = await fetch("/api/admin/candidatos/upload-foto", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setErroUpload(data.error ?? "Falha no upload");
        return;
      }
      setNovaFoto(data.url);
    } catch (e) {
      setErroUpload(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setUploadingFoto(false);
    }
  }

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
      {semSubcategorias && (
        <Card className="border-2 border-amber-300 bg-amber-50/60">
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-800" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-lg font-bold text-amber-900">
                  Cadastre subcategorias primeiro (ou importe tudo de uma vez)
                </h2>
                <p className="text-sm text-amber-900/80 mt-1 leading-relaxed">
                  Todo candidato precisa pertencer a uma subcategoria (ex:
                  &ldquo;Melhor pizzaria&rdquo;, &ldquo;Melhor academia&rdquo;).
                  Hoje você ainda não tem nenhuma — pra cadastrar candidato
                  individual, crie subcategorias antes. Ou{" "}
                  <strong>use o importador abaixo com XLSX/CSV</strong> que
                  cria categorias, subcategorias e candidatos numa só passada.
                </p>
                <Link
                  href="/admin/categorias"
                  className="inline-flex items-center gap-2 mt-3 h-10 px-4 rounded-md bg-amber-700 text-white text-sm font-medium hover:bg-amber-800"
                >
                  <FolderTree className="w-4 h-4" />
                  Ir pra Categorias
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={semSubcategorias ? "opacity-60" : ""}>
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
                disabled={semSubcategorias}
                className="w-full h-11 px-3 rounded-xl border border-[rgba(10,42,94,0.15)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cdl-blue/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {semSubcategorias
                    ? "Nenhuma subcategoria cadastrada — crie em /admin/categorias"
                    : "— escolha uma subcategoria —"}
                </option>
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
            <div className="sm:col-span-2">
              <label className="text-xs text-muted block mb-1">Descrição (opcional)</label>
              <Input
                value={novaDesc}
                onChange={(e) => setNovaDesc(e.target.value)}
                placeholder="curta — até 280 caracteres"
                maxLength={280}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted block mb-1">Foto (opcional)</label>
              <div className="flex flex-wrap items-center gap-3">
                {novaFoto ? (
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={novaFoto}
                      alt="preview"
                      className="w-14 h-14 rounded-full object-cover border border-border bg-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => setNovaFoto("")}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center text-xs">
                    sem foto
                  </div>
                )}
                <label className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-cdl-blue text-white text-sm font-medium cursor-pointer hover:bg-cdl-blue-dark disabled:opacity-50">
                  <Upload className="w-4 h-4" />
                  {uploadingFoto ? "Enviando..." : novaFoto ? "Trocar foto" : "Escolher arquivo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={semSubcategorias || uploadingFoto}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadFoto(f);
                      e.target.value = ""; // permite reupload do mesmo arquivo
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              <details className="mt-2 text-xs">
                <summary className="text-muted cursor-pointer hover:text-cdl-blue">
                  Ou colar a URL de uma imagem online
                </summary>
                <Input
                  value={novaFoto}
                  onChange={(e) => setNovaFoto(e.target.value)}
                  placeholder="https://..."
                  className="mt-2"
                />
              </details>
              {erroUpload && (
                <p className="text-xs text-red-600 mt-2">⚠ {erroUpload}</p>
              )}
              <p className="text-[11px] text-muted mt-2">
                PNG, JPG ou WebP. Máximo 3MB. Recomendado: foto quadrada.
              </p>
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
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cdl-blue/10 flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5 text-cdl-blue" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-cdl-blue">
                  Importar candidatos em lote
                </h2>
                <p className="text-sm text-muted mt-1">
                  Aceita <strong>XLSX</strong> e <strong>CSV</strong>. Categorias e
                  subcategorias são <strong>criadas automaticamente</strong> se ainda não existirem.
                </p>
                <p className="text-xs text-muted mt-1">
                  Colunas: <code className="bg-zinc-100 px-1 rounded">categoria · subcategoria · nome</code>{" "}
                  (e opcionais <code className="bg-zinc-100 px-1 rounded">descricao · foto_url</code>)
                </p>
              </div>
            </div>
            <a
              href="/api/admin/candidatos/importar/template"
              download
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-cdl-blue/30 text-cdl-blue hover:bg-cdl-blue hover:text-white text-sm font-semibold transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              Baixar modelo XLSX
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="file"
              accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
                ✓ {resultado.inseridos} candidato(s) inserido(s)
                {!!resultado.categoriasCriadas &&
                  ` · ${resultado.categoriasCriadas} categoria(s) nova(s)`}
                {!!resultado.subcategoriasCriadas &&
                  ` · ${resultado.subcategoriasCriadas} subcategoria(s) nova(s)`}
                {resultado.ignorados > 0 && ` · ${resultado.ignorados} ignorado(s)`}
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

      {!semSubcategorias && (
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
      )}
    </div>
  );
}
