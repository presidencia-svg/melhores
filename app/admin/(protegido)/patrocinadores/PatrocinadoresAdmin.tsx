"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
  ExternalLink,
} from "lucide-react";
import {
  COTAS,
  LABEL_NIVEIS,
  type Patrocinador,
  type NivelPatrocinio,
} from "@/lib/patrocinadores/types";

const NIVEIS: NivelPatrocinio[] = ["patrocinio", "apoio"];

const CORES_NIVEL: Record<NivelPatrocinio, string> = {
  patrocinio: "bg-yellow-100 text-yellow-800",
  apoio: "bg-zinc-100 text-zinc-700",
};

export function PatrocinadoresAdmin({
  patrocinadores: lista,
}: {
  patrocinadores: Patrocinador[];
}) {
  // NAO usar useState(lista) aqui — congelaria a prop no primeiro render
  // e router.refresh() depois do salvar nao atualizaria a UI (o que
  // causou o bug "salvei mas nao apareceu"). A prop ja' vem fresca do
  // server quando re-renderiza.
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [link, setLink] = useState("");
  const [nivel, setNivel] = useState<NivelPatrocinio>("apoio");
  const [logoUrl, setLogoUrl] = useState("");
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);

  async function uploadLogo(file: File) {
    setEnviandoLogo(true);
    setErro(null);
    try {
      const form = new FormData();
      form.append("logo", file);
      const res = await fetch("/api/admin/patrocinadores/upload", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setLogoUrl(json.url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setEnviandoLogo(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!logoUrl) {
      setErro("Faça upload da logomarca primeiro");
      return;
    }
    if (nome.trim().length < 2) {
      setErro("Nome do patrocinador é obrigatório");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/admin/patrocinadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          logo_url: logoUrl,
          link: link.trim() || null,
          nivel,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setNome("");
      setLink("");
      setLogoUrl("");
      setNivel("apoio");
      setAberto(false);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: string, nomeP: string) {
    if (!confirm(`Remover patrocinador "${nomeP}"? Não dá pra desfazer.`))
      return;
    try {
      const res = await fetch(`/api/admin/patrocinadores/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (e) {
      alert("Erro: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Lista atual */}
      {lista.length === 0 ? (
        <div className="text-center py-8 text-muted">
          <p className="text-sm">Nenhum patrocinador cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {lista.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 p-3 rounded-lg border border-border bg-cream-100/30"
            >
              <div className="w-20 h-12 flex items-center justify-center bg-white rounded border border-border shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.logo_url}
                  alt={p.nome}
                  className="max-h-10 max-w-[72px] object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display-bold text-navy-800 truncate">
                  {p.nome}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${CORES_NIVEL[p.nivel]}`}
                  >
                    {LABEL_NIVEIS[p.nivel]}
                  </span>
                  {p.link && (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cdl-blue hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      site
                    </a>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => remover(p.id, p.nome)}
                className="text-rose-600 hover:bg-rose-50 p-2 rounded"
                aria-label={`Remover ${p.nome}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botão novo */}
      {!aberto && (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="inline-flex items-center justify-center gap-2 h-11 rounded-md bg-cdl-blue text-white font-semibold hover:bg-cdl-blue/90"
        >
          <Plus className="w-4 h-4" /> Adicionar patrocinador
        </button>
      )}

      {/* Form */}
      {aberto && (
        <form
          onSubmit={salvar}
          className="flex flex-col gap-3 p-4 rounded-lg border border-cdl-blue/30 bg-cdl-blue/5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display-bold text-cdl-blue">
              Novo patrocinador
            </h3>
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                setErro(null);
              }}
              className="text-muted hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <label className="text-sm font-medium text-cdl-blue">
            Nome
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Banco do Nordeste"
              maxLength={120}
              className="mt-1 w-full h-11 rounded-md border border-border bg-white px-3"
            />
          </label>

          <label className="text-sm font-medium text-cdl-blue">
            Cota
            <select
              value={nivel}
              onChange={(e) => setNivel(e.target.value as NivelPatrocinio)}
              className="mt-1 w-full h-11 rounded-md border border-border bg-white px-3"
            >
              {NIVEIS.map((n) => {
                const usados = lista.filter((p) => p.nivel === n).length;
                const limite = COTAS[n];
                const cheio = usados >= limite;
                return (
                  <option key={n} value={n} disabled={cheio}>
                    {LABEL_NIVEIS[n]} ({usados}/{limite})
                    {n === "patrocinio" ? " — logo gigante" : " — logo médio"}
                    {cheio ? " · ESGOTADO" : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="text-sm font-medium text-cdl-blue">
            Link (opcional)
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://patrocinador.com.br"
              className="mt-1 w-full h-11 rounded-md border border-border bg-white px-3"
            />
          </label>

          <div>
            <p className="text-sm font-medium text-cdl-blue mb-1">Logomarca</p>
            <input
              ref={inputFileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadLogo(f);
              }}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => inputFileRef.current?.click()}
                disabled={enviandoLogo}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-cdl-blue/40 text-cdl-blue hover:bg-cdl-blue hover:text-white text-sm font-medium disabled:opacity-60"
              >
                {enviandoLogo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Enviando…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />{" "}
                    {logoUrl ? "Trocar logomarca" : "Escolher arquivo"}
                  </>
                )}
              </button>
              {logoUrl && (
                <div className="w-24 h-12 flex items-center justify-center bg-white rounded border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="preview"
                    className="max-h-10 max-w-[88px] object-contain"
                  />
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted mt-1">
              PNG, JPG, WebP ou SVG até 2MB. SVG é melhor para logos vetoriais.
            </p>
          </div>

          {erro && (
            <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={salvando || enviandoLogo}
            className="inline-flex items-center justify-center gap-2 h-11 rounded-md bg-cdl-blue text-white font-semibold hover:bg-cdl-blue/90 disabled:opacity-60"
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Salvando…
              </>
            ) : (
              "Salvar patrocinador"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
