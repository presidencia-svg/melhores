"use client";

import { useState, useRef } from "react";
import { Loader2, Upload, Check, ImageIcon, Trash2 } from "lucide-react";

export function MarcaForm({
  nomeAtual,
  logoAtual,
  corPrimariaAtual,
  corSecundariaAtual,
}: {
  nomeAtual: string;
  logoAtual: string | null;
  corPrimariaAtual: string | null;
  corSecundariaAtual: string | null;
}) {
  const [logoUrl, setLogoUrl] = useState<string | null>(logoAtual);
  const [corPrimaria, setCorPrimaria] = useState(corPrimariaAtual ?? "#0c2a5b");
  const [corSecundaria, setCorSecundaria] = useState(
    corSecundariaAtual ?? "#1ea049"
  );
  const [enviando, setEnviando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function escolherArquivo(file: File) {
    setErro(null);
    setMensagem(null);
    if (file.size > 2 * 1024 * 1024) {
      setErro("Arquivo maior que 2MB. Reduza o tamanho.");
      return;
    }
    if (
      !["image/png", "image/jpeg", "image/svg+xml", "image/webp"].includes(
        file.type
      )
    ) {
      setErro("Formato não suportado. Use PNG, JPG, SVG ou WebP.");
      return;
    }
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch("/api/admin/marca/upload", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setErro(json.error ?? "Falha no upload");
        return;
      }
      setLogoUrl(json.url);
      setMensagem("Logo enviado. Não esqueça de clicar em Salvar abaixo.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setEnviando(false);
    }
  }

  async function removerLogo() {
    if (!confirm("Remover o logo atual?")) return;
    setLogoUrl(null);
    setMensagem("Logo removido. Clique em Salvar pra confirmar.");
  }

  async function salvar() {
    setErro(null);
    setMensagem(null);
    setSalvando(true);
    try {
      const res = await fetch("/api/admin/marca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_url: logoUrl,
          cor_primaria: corPrimaria,
          cor_secundaria: corSecundaria,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setErro(json.error ?? "Falha ao salvar");
        return;
      }
      setMensagem("Marca atualizada. Recarregue a página pra ver no painel.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="text-sm font-medium text-cdl-blue mb-2 block">
          Logo de {nomeAtual}
        </label>

        <div className="flex items-center gap-4">
          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border bg-zinc-50 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo atual"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <ImageIcon className="w-12 h-12 text-zinc-300" />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) escolherArquivo(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={enviando}
              className="h-10 px-4 inline-flex items-center gap-2 rounded-md bg-cdl-blue text-white text-sm font-medium hover:bg-cdl-blue-dark disabled:opacity-50"
            >
              {enviando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {logoUrl ? "Trocar logo" : "Enviar logo"}
            </button>
            {logoUrl ? (
              <button
                type="button"
                onClick={removerLogo}
                className="h-10 px-4 inline-flex items-center gap-2 rounded-md border border-border text-sm text-zinc-600 hover:bg-zinc-50"
              >
                <Trash2 className="w-4 h-4" />
                Remover
              </button>
            ) : null}
            <p className="text-xs text-muted">
              PNG/SVG/JPG/WebP, máx 2MB.
            </p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-cdl-blue mb-2 block">
            Cor primária
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={corPrimaria}
              onChange={(e) => setCorPrimaria(e.target.value)}
              className="h-10 w-14 rounded border border-border cursor-pointer"
            />
            <input
              type="text"
              value={corPrimaria}
              onChange={(e) => setCorPrimaria(e.target.value)}
              className="flex-1 h-10 rounded-md border border-border bg-white px-3 font-mono text-sm"
            />
          </div>
          <p className="text-xs text-muted mt-1">Botões e cabeçalhos.</p>
        </div>

        <div>
          <label className="text-sm font-medium text-cdl-blue mb-2 block">
            Cor secundária
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={corSecundaria}
              onChange={(e) => setCorSecundaria(e.target.value)}
              className="h-10 w-14 rounded border border-border cursor-pointer"
            />
            <input
              type="text"
              value={corSecundaria}
              onChange={(e) => setCorSecundaria(e.target.value)}
              className="flex-1 h-10 rounded-md border border-border bg-white px-3 font-mono text-sm"
            />
          </div>
          <p className="text-xs text-muted mt-1">Destaques e ícones.</p>
        </div>
      </div>

      {erro ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {erro}
        </p>
      ) : null}
      {mensagem ? (
        <p className="text-sm text-cdl-green-dark bg-cdl-green/10 border border-cdl-green/30 rounded-md p-2 inline-flex items-center gap-2">
          <Check className="w-4 h-4" />
          {mensagem}
        </p>
      ) : null}

      <div className="flex justify-end pt-2 border-t border-border">
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="h-11 px-6 inline-flex items-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark disabled:opacity-50"
        >
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Salvar marca
        </button>
      </div>
    </div>
  );
}
