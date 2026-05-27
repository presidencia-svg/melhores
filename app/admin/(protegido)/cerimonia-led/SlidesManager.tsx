"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Upload, Loader2, Trash2, ImageIcon, FileSpreadsheet } from "lucide-react";

export type SlideRow = {
  id: string;
  ordem: number;
  empresa: string;
  recebe: string | null;
  instagram: string | null;
  logo_url: string | null;
};

export function SlidesManager({
  slides,
  tenantNome,
}: {
  slides: SlideRow[];
  tenantNome: string;
}) {
  const router = useRouter();
  const [importando, setImportando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function importarPlanilha(file: File) {
    setErro(null);
    setOk(null);
    setImportando(true);
    try {
      const fd = new FormData();
      fd.append("planilha", file);
      const res = await fetch("/api/admin/cerimonia-led/importar", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as { ok?: boolean; inseridos?: number; error?: string };
      if (!res.ok || !json.ok) {
        setErro(json.error ?? "Falha ao importar");
        return;
      }
      setOk(`✓ ${json.inseridos} slides importados`);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setImportando(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Import area */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-cdl-blue text-white font-medium cursor-pointer hover:bg-cdl-blue-dark disabled:opacity-50">
              {importando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              {importando ? "Importando..." : "Importar / substituir planilha"}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                disabled={importando}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void importarPlanilha(f);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </label>
            <span className="text-xs text-muted">
              Importar de novo apaga todos os slides atuais ({slides.length}) e
              recria pela planilha.
            </span>
          </div>
          {erro && (
            <p className="text-sm text-red-600 mt-2">⚠ {erro}</p>
          )}
          {ok && (
            <p className="text-sm text-cdl-green-dark mt-2">{ok}</p>
          )}
        </CardContent>
      </Card>

      {/* Slides list */}
      {slides.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted">
            {slides.length} {slides.length === 1 ? "slide" : "slides"} ·{" "}
            <strong className="text-cdl-blue">{tenantNome}</strong>
          </p>
          {slides.map((s, idx) => (
            <SlideCard key={s.id} slide={s} ordemExibida={idx + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function SlideCard({
  slide,
  ordemExibida,
}: {
  slide: SlideRow;
  ordemExibida: number;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function uploadLogo(file: File) {
    setErro(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const r1 = await fetch("/api/admin/cerimonia-led/upload-logo", {
        method: "POST",
        body: fd,
      });
      const d1 = (await r1.json()) as { url?: string; error?: string };
      if (!r1.ok || !d1.url) {
        setErro(d1.error ?? "Falha no upload");
        return;
      }
      const r2 = await fetch(`/api/admin/cerimonia-led/slides/${slide.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_url: d1.url }),
      });
      if (!r2.ok) {
        const d2 = (await r2.json()) as { error?: string };
        setErro(d2.error ?? "Falha ao associar logo");
        return;
      }
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setUploading(false);
    }
  }

  async function removerSlide() {
    if (!confirm(`Remover slide "${slide.empresa}"?`)) return;
    setRemoving(true);
    try {
      await fetch(`/api/admin/cerimonia-led/slides/${slide.id}`, {
        method: "DELETE",
      });
      router.refresh();
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex items-center justify-center w-16 h-16 rounded-md bg-zinc-100 border border-border shrink-0 overflow-hidden">
            {slide.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={slide.logo_url}
                alt={slide.empresa}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-zinc-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted">
              Slide {ordemExibida}
            </p>
            <p className="font-display-bold text-navy-800 text-base truncate">
              {slide.empresa}
            </p>
            {slide.recebe && (
              <p className="text-xs text-muted truncate">
                Recebe: {slide.recebe}
              </p>
            )}
            {slide.instagram && (
              <p className="text-xs text-cdl-blue truncate font-mono">
                {slide.instagram}
              </p>
            )}
            {erro && <p className="text-xs text-red-600 mt-1">⚠ {erro}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="inline-flex items-center gap-1 h-9 px-3 rounded-md border border-cdl-blue/30 text-cdl-blue text-xs font-medium cursor-pointer hover:bg-cdl-blue/5">
              {uploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
              {slide.logo_url ? "Trocar logo" : "Subir logo"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadLogo(f);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </label>
            <button
              onClick={removerSlide}
              disabled={removing}
              className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
