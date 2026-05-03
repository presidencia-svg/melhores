"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { Crown, Download, Loader2, Package, X } from "lucide-react";

export type Podium = {
  subcategoria_id: string;
  subcategoria_nome: string;
  total_subcat: number;
  top1_id: string;
  top1_nome: string;
  top1_foto: string | null;
  top1_votos: number;
  top2_id: string | null;
  top2_nome: string | null;
  top2_foto: string | null;
  top2_votos: number;
  top3_id: string | null;
  top3_nome: string | null;
  top3_foto: string | null;
  top3_votos: number;
};

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pctOf(votos: number, total: number): number {
  return total > 0 ? (votos / total) * 100 : 0;
}

export function PodiumLista({ podiums }: { podiums: Podium[] }) {
  const [progresso, setProgresso] = useState<{
    feito: number;
    total: number;
    erros: string[];
  } | null>(null);
  const cancelarRef = useRef(false);

  async function baixarTodos() {
    if (progresso) return;
    cancelarRef.current = false;
    const total = podiums.length;
    setProgresso({ feito: 0, total, erros: [] });
    const zip = new JSZip();
    const erros: string[] = [];

    for (let i = 0; i < podiums.length; i++) {
      if (cancelarRef.current) {
        setProgresso(null);
        return;
      }
      const p = podiums[i]!;
      const node = document.querySelector<HTMLElement>(
        `[data-story-id="${p.subcategoria_id}"]`
      );
      if (!node) {
        erros.push(p.subcategoria_nome);
        setProgresso({ feito: i + 1, total, erros: [...erros] });
        continue;
      }
      try {
        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: "#0a2a5e",
        });
        const base64 = dataUrl.split(",")[1] ?? "";
        const nomeArquivo = `${String(i + 1).padStart(3, "0")}-${slug(p.subcategoria_nome)}.png`;
        zip.file(nomeArquivo, base64, { base64: true });
      } catch (e) {
        console.error(`Falha em ${p.subcategoria_nome}:`, e);
        erros.push(p.subcategoria_nome);
      }
      setProgresso({ feito: i + 1, total, erros: [...erros] });
      // Da uma respirada pro browser nao travar a UI
      await new Promise((r) => setTimeout(r, 50));
    }

    if (cancelarRef.current) {
      setProgresso(null);
      return;
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `melhores-do-ano-stories-${new Date().toISOString().slice(0, 10)}.zip`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setProgresso(null);

    if (erros.length > 0) {
      alert(
        `Baixou ${total - erros.length} de ${total}. Falharam:\n${erros.join("\n")}\n\nProvavelmente foto bloqueada por CORS — gere essas individualmente.`
      );
    }
  }

  const baixando = progresso !== null;
  const pctProgresso = progresso ? Math.round((progresso.feito / progresso.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cdl-blue/20 bg-cream-100 p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-cdl-green/15 text-cdl-green flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-base font-bold text-cdl-blue">
                Baixar todos os Stories de uma vez
              </p>
              <p className="text-xs text-muted leading-snug">
                {podiums.length} cards no formato 1080×1920 dentro de um único ZIP.
                Use no Chrome desktop e não feche a aba durante o processo.
              </p>
            </div>
          </div>

          {baixando ? (
            <button
              type="button"
              onClick={() => {
                cancelarRef.current = true;
              }}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          ) : (
            <button
              type="button"
              onClick={baixarTodos}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-cdl-green text-white text-sm font-medium hover:bg-cdl-green-dark transition-colors"
            >
              <Download className="w-4 h-4" />
              Baixar todos ({podiums.length})
            </button>
          )}
        </div>

        {progresso && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-cdl-blue mb-1.5 font-mono tabular-nums">
              <span>
                {progresso.feito} de {progresso.total}
                {progresso.erros.length > 0 && ` · ${progresso.erros.length} falha(s)`}
              </span>
              <span>{pctProgresso}%</span>
            </div>
            <div className="h-2 rounded-full bg-cdl-blue/10 overflow-hidden">
              <div
                className="h-full bg-cdl-green transition-all"
                style={{ width: `${pctProgresso}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {podiums.map((p) => (
          <PodiumCard key={p.subcategoria_id} podium={p} />
        ))}
      </div>
    </div>
  );
}

function PodiumCard({ podium }: { podium: Podium }) {
  const feedRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const [baixando, setBaixando] = useState<"feed" | "story" | null>(null);

  async function baixar(formato: "feed" | "story") {
    const node = formato === "feed" ? feedRef.current : storyRef.current;
    if (!node) return;
    setBaixando(formato);
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0a2a5e",
      });
      const link = document.createElement("a");
      link.download = `podium-${slug(podium.subcategoria_nome)}-${formato}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert(
        "Falha ao gerar imagem. Pode ser foto bloqueada por CORS — tira print da tela como alternativa."
      );
    } finally {
      setBaixando(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Card visivel formato Feed */}
      <div ref={feedRef}>
        <CardFeed podium={podium} />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => baixar("feed")}
          disabled={baixando !== null}
          className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-cdl-blue text-white text-sm font-medium hover:bg-cdl-blue-dark transition-colors disabled:opacity-50"
        >
          {baixando === "feed" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Feed (1:1)
        </button>
        <button
          onClick={() => baixar("story")}
          disabled={baixando !== null}
          className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-cdl-green text-white text-sm font-medium hover:bg-cdl-green-dark transition-colors disabled:opacity-50"
        >
          {baixando === "story" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Story (9:16)
        </button>
      </div>

      {/* Card story off-screen */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: -99999,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <div ref={storyRef} data-story-id={podium.subcategoria_id}>
          <CardStory podium={podium} />
        </div>
      </div>
    </div>
  );
}

const MEDALHAS = ["🥇", "🥈", "🥉"];
const ACENTOS = ["text-amber-300", "text-slate-200", "text-orange-300"];
const BORDAS = ["border-amber-300", "border-slate-200", "border-orange-300"];

function CardFeed({ podium }: { podium: Podium }) {
  const pct1 = pctOf(podium.top1_votos, podium.total_subcat);
  const pct2 = podium.top2_id ? pctOf(podium.top2_votos, podium.total_subcat) : 0;
  const pct3 = podium.top3_id ? pctOf(podium.top3_votos, podium.total_subcat) : 0;

  return (
    <article
      className="aspect-square rounded-2xl overflow-hidden flex flex-col p-5 relative shadow-lg text-white"
      style={{
        backgroundColor: "#0a2a5e",
        backgroundImage:
          "radial-gradient(circle at 50% 25%, rgba(255,215,0,0.18) 0%, transparent 55%)",
      }}
    >
      <div className="text-center text-[10px] uppercase tracking-[0.2em] font-semibold opacity-80">
        Resultado oficial · CDL Aracaju
      </div>
      <h2 className="font-display text-xl font-bold mt-1 leading-tight text-center line-clamp-2">
        {podium.subcategoria_nome}
      </h2>

      {/* CAMPEAO — hero */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 mt-2">
        <div className="flex items-center gap-1.5 text-amber-300 text-[11px] uppercase tracking-[0.25em] font-bold">
          <Crown className="w-3.5 h-3.5 fill-amber-300" />
          campeão
        </div>
        <CampeaoFoto foto={podium.top1_foto} nome={podium.top1_nome} size={108} />
        <p
          className="font-display-bold text-center leading-tight line-clamp-2 max-w-full px-2"
          style={{ fontSize: 22 }}
          title={podium.top1_nome}
        >
          {podium.top1_nome}
        </p>
        <p
          className="font-display text-amber-300 leading-none"
          style={{ fontSize: 38 }}
        >
          {pct1.toFixed(1)}%
        </p>
      </div>

      {/* 2o e 3o lado a lado, compactos */}
      <div className="grid grid-cols-2 gap-3 mt-1 mb-1">
        {podium.top2_id && (
          <Coadjuvante
            pos={2}
            nome={podium.top2_nome!}
            foto={podium.top2_foto}
            pct={pct2}
            small
          />
        )}
        {podium.top3_id && (
          <Coadjuvante
            pos={3}
            nome={podium.top3_nome!}
            foto={podium.top3_foto}
            pct={pct3}
            small
          />
        )}
      </div>

      <p className="text-center text-[10px] opacity-80 mt-1">
        {podium.total_subcat.toLocaleString("pt-BR")} votos · escolhido por você
      </p>
      <p className="text-center text-[11px] mt-0.5 text-amber-300 font-bold">
        cdlaju.com.br
      </p>
    </article>
  );
}

function CardStory({ podium }: { podium: Podium }) {
  const pct1 = pctOf(podium.top1_votos, podium.total_subcat);
  const pct2 = podium.top2_id ? pctOf(podium.top2_votos, podium.total_subcat) : 0;
  const pct3 = podium.top3_id ? pctOf(podium.top3_votos, podium.total_subcat) : 0;

  return (
    <article
      className="flex flex-col px-14 relative text-white"
      style={{
        width: 1080,
        height: 1920,
        paddingTop: 220,
        paddingBottom: 240,
        backgroundColor: "#0a2a5e",
        backgroundImage:
          "radial-gradient(circle at 50% 32%, rgba(255,215,0,0.25) 0%, transparent 55%), radial-gradient(circle at 50% 100%, rgba(0,168,89,0.12) 0%, transparent 50%)",
      }}
    >
      <div>
        <div
          className="text-center uppercase tracking-[0.3em] font-bold opacity-90"
          style={{ fontSize: 32 }}
        >
          Resultado oficial · CDL Aracaju
        </div>
        <h2
          className="font-display font-bold mt-6 leading-[1.0] text-center"
          style={{ fontSize: 100 }}
        >
          {podium.subcategoria_nome}
        </h2>
      </div>

      {/* CAMPEAO — hero gigante */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div
          className="flex items-center gap-3 text-amber-300 uppercase font-bold tracking-[0.4em]"
          style={{ fontSize: 36 }}
        >
          <Crown className="w-10 h-10 fill-amber-300" />
          campeão
        </div>
        <div className="mt-6">
          <CampeaoFoto
            foto={podium.top1_foto}
            nome={podium.top1_nome}
            size={420}
          />
        </div>
        <p
          className="font-display-bold text-center leading-tight mt-8 px-8"
          style={{ fontSize: 80 }}
          title={podium.top1_nome}
        >
          {podium.top1_nome}
        </p>
        <p
          className="font-display text-amber-300 leading-none mt-4"
          style={{ fontSize: 144 }}
        >
          {pct1.toFixed(1)}%
        </p>
      </div>

      {/* 2o e 3o em linha, compactos */}
      <div className="grid grid-cols-2 gap-6">
        {podium.top2_id && (
          <Coadjuvante
            pos={2}
            nome={podium.top2_nome!}
            foto={podium.top2_foto}
            pct={pct2}
            small={false}
          />
        )}
        {podium.top3_id && (
          <Coadjuvante
            pos={3}
            nome={podium.top3_nome!}
            foto={podium.top3_foto}
            pct={pct3}
            small={false}
          />
        )}
      </div>

      <div className="mt-10">
        <p
          className="text-center font-semibold opacity-90"
          style={{ fontSize: 32 }}
        >
          {podium.total_subcat.toLocaleString("pt-BR")} votos · escolhido por você
        </p>
        <p
          className="text-center text-amber-300 font-bold mt-3"
          style={{ fontSize: 44 }}
        >
          cdlaju.com.br
        </p>
      </div>
    </article>
  );
}

// Foto grande do campeao com glow dourado e borda dupla.
function CampeaoFoto({
  foto,
  nome,
  size,
}: {
  foto: string | null;
  nome: string;
  size: number;
}) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow dourado por tras */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: `0 0 ${size * 0.25}px ${size * 0.05}px rgba(255,215,0,0.45)`,
        }}
      />
      <div
        className="relative rounded-full overflow-hidden bg-white/10 flex items-center justify-center"
        style={{
          width: size,
          height: size,
          border: `${Math.max(4, size * 0.025)}px solid #fcd34d`,
        }}
      >
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            alt={nome}
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
          />
        ) : (
          // Sem foto: mostra a medalha de ouro em vez da inicial do nome
          <span
            aria-hidden="true"
            style={{ fontSize: size * 0.55, lineHeight: 1 }}
          >
            🥇
          </span>
        )}
      </div>
    </div>
  );
}

// Card menor pra 2o e 3o lugar — fica lado a lado.
function Coadjuvante({
  pos,
  nome,
  foto,
  pct,
  small,
}: {
  pos: 2 | 3;
  nome: string;
  foto: string | null;
  pct: number;
  small: boolean;
}) {
  const idx = pos - 1;
  const fotoSize = small ? 56 : 160;

  return (
    <div
      className="flex flex-col items-center text-center bg-white/5 rounded-2xl"
      style={{ padding: small ? 8 : 24 }}
    >
      <div className={`flex items-center gap-1 ${ACENTOS[idx]} font-bold`}>
        <span style={{ fontSize: small ? 14 : 32 }}>{MEDALHAS[idx]}</span>
        <span
          className="uppercase tracking-[0.2em]"
          style={{ fontSize: small ? 9 : 22 }}
        >
          {pos}º lugar
        </span>
      </div>
      <div
        className={`relative rounded-full overflow-hidden border-2 ${BORDAS[idx]} bg-white/10 flex items-center justify-center mt-1`}
        style={{ width: fotoSize, height: fotoSize }}
      >
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            alt={nome}
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
          />
        ) : (
          // Sem foto: medalha do lugar (🥈/🥉) em vez de inicial do nome
          <span
            aria-hidden="true"
            style={{ fontSize: fotoSize * 0.55, lineHeight: 1 }}
          >
            {MEDALHAS[idx]}
          </span>
        )}
      </div>
      <p
        className={`font-semibold leading-tight line-clamp-2 mt-1 px-1`}
        style={{ fontSize: small ? 12 : 32 }}
        title={nome}
      >
        {nome}
      </p>
      <p
        className={`font-display ${ACENTOS[idx]} leading-none`}
        style={{ fontSize: small ? 18 : 56, marginTop: small ? 2 : 8 }}
      >
        {pct.toFixed(1)}%
      </p>
    </div>
  );
}
