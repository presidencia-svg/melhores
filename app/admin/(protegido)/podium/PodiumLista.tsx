"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Loader2 } from "lucide-react";

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
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {podiums.map((p) => (
        <PodiumCard key={p.subcategoria_id} podium={p} />
      ))}
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
        <div ref={storyRef}>
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
  const lugares = [
    {
      pos: 1,
      nome: podium.top1_nome,
      foto: podium.top1_foto,
      votos: podium.top1_votos,
    },
    podium.top2_id && {
      pos: 2,
      nome: podium.top2_nome!,
      foto: podium.top2_foto,
      votos: podium.top2_votos,
    },
    podium.top3_id && {
      pos: 3,
      nome: podium.top3_nome!,
      foto: podium.top3_foto,
      votos: podium.top3_votos,
    },
  ].filter(Boolean) as {
    pos: 1 | 2 | 3;
    nome: string;
    foto: string | null;
    votos: number;
  }[];

  return (
    <article
      className="aspect-square rounded-2xl overflow-hidden flex flex-col p-6 relative shadow-lg text-white"
      style={{ backgroundColor: "#0a2a5e" }}
    >
      <div className="text-center text-[10px] uppercase tracking-[0.2em] font-semibold opacity-80">
        Resultado oficial · CDL Aracaju
      </div>

      <h2 className="font-display text-2xl font-bold mt-1 leading-tight text-center line-clamp-2">
        {podium.subcategoria_nome}
      </h2>

      <div className="flex-1 flex flex-col gap-3 my-3 justify-center">
        {lugares.map((l, i) => (
          <LinhaPodium
            key={l.pos}
            pos={l.pos}
            nome={l.nome}
            foto={l.foto}
            votos={l.votos}
            pct={pctOf(l.votos, podium.total_subcat)}
            destaque={i === 0}
            small
          />
        ))}
      </div>

      <p className="text-center text-[11px] opacity-90 font-semibold">
        {podium.total_subcat.toLocaleString("pt-BR")} votos · escolhido por você
      </p>
      <p className="text-center text-xs mt-1 text-amber-300 font-bold">
        cdlaju.com.br
      </p>
    </article>
  );
}

function CardStory({ podium }: { podium: Podium }) {
  const lugares = [
    {
      pos: 1,
      nome: podium.top1_nome,
      foto: podium.top1_foto,
      votos: podium.top1_votos,
    },
    podium.top2_id && {
      pos: 2,
      nome: podium.top2_nome!,
      foto: podium.top2_foto,
      votos: podium.top2_votos,
    },
    podium.top3_id && {
      pos: 3,
      nome: podium.top3_nome!,
      foto: podium.top3_foto,
      votos: podium.top3_votos,
    },
  ].filter(Boolean) as {
    pos: 1 | 2 | 3;
    nome: string;
    foto: string | null;
    votos: number;
  }[];

  return (
    <article
      className="flex flex-col px-14 relative text-white"
      style={{
        width: 1080,
        height: 1920,
        paddingTop: 260,
        paddingBottom: 260,
        backgroundColor: "#0a2a5e",
        backgroundImage:
          "radial-gradient(circle at 50% 0%, rgba(255,215,0,0.18) 0%, transparent 55%), radial-gradient(circle at 50% 100%, rgba(0,168,89,0.12) 0%, transparent 50%)",
      }}
    >
      <div>
        <div
          className="text-center uppercase tracking-[0.3em] font-bold opacity-90"
          style={{ fontSize: 36 }}
        >
          Resultado oficial · CDL Aracaju
        </div>
        <h2
          className="font-display font-bold mt-8 leading-[1.0] text-center"
          style={{ fontSize: 120 }}
        >
          {podium.subcategoria_nome}
        </h2>
        <p
          className="font-light text-amber-300 mt-5 italic text-center"
          style={{ fontSize: 44 }}
        >
          os 3 melhores escolhidos por você
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-10 justify-center">
        {lugares.map((l, i) => (
          <LinhaPodium
            key={l.pos}
            pos={l.pos}
            nome={l.nome}
            foto={l.foto}
            votos={l.votos}
            pct={pctOf(l.votos, podium.total_subcat)}
            destaque={i === 0}
            small={false}
          />
        ))}
      </div>

      <div>
        <p
          className="text-center font-semibold opacity-90"
          style={{ fontSize: 36 }}
        >
          Total de {podium.total_subcat.toLocaleString("pt-BR")} votos
        </p>
        <p
          className="text-center text-amber-300 font-bold mt-3"
          style={{ fontSize: 48 }}
        >
          cdlaju.com.br
        </p>
      </div>
    </article>
  );
}

function LinhaPodium({
  pos,
  nome,
  foto,
  votos,
  pct,
  destaque,
  small,
}: {
  pos: 1 | 2 | 3;
  nome: string;
  foto: string | null;
  votos: number;
  pct: number;
  destaque: boolean;
  small: boolean;
}) {
  const inicial = nome.trim().charAt(0).toUpperCase() || "?";
  const fotoSize = small ? (destaque ? 64 : 52) : destaque ? 200 : 160;
  const idx = pos - 1;

  return (
    <div className="flex items-center gap-4">
      {/* Posicao + medalha */}
      <div
        className={`shrink-0 font-display font-bold ${ACENTOS[idx]}`}
        style={{ fontSize: small ? 32 : 100, lineHeight: 1 }}
      >
        {pos}
        <span style={{ fontSize: small ? 14 : 38, marginLeft: small ? 2 : 6 }}>
          º
        </span>
      </div>

      {/* Foto */}
      <div
        className={`relative rounded-full overflow-hidden border-4 ${BORDAS[idx]} bg-white/10 flex items-center justify-center shrink-0`}
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
          <span
            className="font-display text-white"
            style={{ fontSize: fotoSize * 0.4 }}
          >
            {inicial}
          </span>
        )}
      </div>

      {/* Nome + votos */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-bold leading-tight line-clamp-2 ${
            small ? "text-base" : ""
          }`}
          style={small ? undefined : { fontSize: destaque ? 56 : 44 }}
          title={nome}
        >
          {nome}
        </p>
        <p
          className={`opacity-80 ${small ? "text-xs" : ""}`}
          style={small ? undefined : { fontSize: 28, marginTop: 8 }}
        >
          {votos.toLocaleString("pt-BR")} votos
        </p>
      </div>

      {/* Percentual */}
      <div
        className={`font-display shrink-0 ${ACENTOS[idx]}`}
        style={{
          fontSize: small ? (destaque ? 28 : 22) : destaque ? 110 : 80,
          lineHeight: 1,
        }}
      >
        <span className="mr-1">{MEDALHAS[idx]}</span>
        {pct.toFixed(1)}%
      </div>
    </div>
  );
}
