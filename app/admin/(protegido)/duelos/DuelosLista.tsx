"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Flame, Loader2 } from "lucide-react";
import type { TenantBranding } from "@/lib/tenant/branding";

export type Duelo = {
  subcategoria_id: string;
  subcategoria_nome: string;
  top1_id: string;
  top1_nome: string;
  top1_foto: string | null;
  top1_votos: number;
  top2_id: string;
  top2_nome: string;
  top2_foto: string | null;
  top2_votos: number;
  total_votos: number;
  diff: number;
  diff_pct: number;
};

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function DuelosLista({
  duelos,
  branding,
}: {
  duelos: Duelo[];
  branding: TenantBranding;
}) {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {duelos.map((d) => (
        <DueloCard key={d.subcategoria_id} duelo={d} branding={branding} />
      ))}
    </div>
  );
}

function DueloCard({
  duelo,
  branding,
}: {
  duelo: Duelo;
  branding: TenantBranding;
}) {
  const feedRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const [baixando, setBaixando] = useState<"feed" | "story" | null>(null);

  const total = duelo.top1_votos + duelo.top2_votos;
  const pct1 = total > 0 ? (duelo.top1_votos / total) * 100 : 50;
  const pct2 = total > 0 ? (duelo.top2_votos / total) * 100 : 50;
  const acirrado = duelo.diff_pct <= 10;

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
      link.download = `duelo-${slug(duelo.subcategoria_nome)}-${formato}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert(
        "Falha ao gerar imagem. Pode ser foto do candidato bloqueada por CORS — tira print da tela como alternativa."
      );
    } finally {
      setBaixando(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Card visivel (formato feed 1:1) */}
      <div ref={feedRef}>
        <CardFeed
          duelo={duelo}
          pct1={pct1}
          pct2={pct2}
          acirrado={acirrado}
          branding={branding}
        />
      </div>

      {/* Botoes de download */}
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

      {/* Card story (off-screen, so renderizado pra captura) */}
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
          <CardStory
            duelo={duelo}
            pct1={pct1}
            pct2={pct2}
            acirrado={acirrado}
            branding={branding}
          />
        </div>
      </div>
    </div>
  );
}

function CardFeed({
  duelo,
  pct1,
  pct2,
  acirrado,
  branding,
}: {
  duelo: Duelo;
  pct1: number;
  pct2: number;
  acirrado: boolean;
  branding: TenantBranding;
}) {
  return (
    <article
      className="aspect-square rounded-2xl overflow-hidden flex flex-col p-6 relative shadow-lg text-white"
      style={{ backgroundColor: "#0a2a5e" }}
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.15em] font-semibold opacity-80">
        <span>Melhores do Ano · {branding.nome}</span>
        {acirrado && (
          <span className="flex items-center gap-1 text-amber-300">
            <Flame className="w-3 h-3" />
            acirrado
          </span>
        )}
      </div>

      <h2 className="font-display text-3xl font-bold mt-2 leading-[1.05] line-clamp-2">
        {duelo.subcategoria_nome}
      </h2>

      <div className="flex-1 flex items-center justify-between gap-3 my-4">
        <Lado
          nome={duelo.top1_nome}
          foto={duelo.top1_foto}
          pct={pct1}
          ganhando
          fotoSize={80}
        />
        <div className="font-display italic text-2xl text-amber-300 shrink-0">
          vs
        </div>
        <Lado
          nome={duelo.top2_nome}
          foto={duelo.top2_foto}
          pct={pct2}
          fotoSize={80}
        />
      </div>

      <div className="h-3 rounded-full bg-white/10 overflow-hidden flex">
        <div className="bg-amber-300 h-full" style={{ width: `${pct1}%` }} />
        <div className="bg-white h-full" style={{ width: `${pct2}%` }} />
      </div>
      <div className="flex justify-between text-xs font-mono mt-1 opacity-90">
        <span>{pct1.toFixed(1)}%</span>
        <span className="opacity-70">dif {duelo.diff_pct}%</span>
        <span>{pct2.toFixed(1)}%</span>
      </div>

      <p className="text-center text-xs mt-4 opacity-90 font-semibold">
        Ainda dá tempo de virar!
        {branding.dominio ? (
          <>
            <br />
            <span className="text-amber-300">{branding.dominio}</span>
          </>
        ) : null}
      </p>
    </article>
  );
}

function CardStory({
  duelo,
  pct1,
  pct2,
  acirrado,
  branding,
}: {
  duelo: Duelo;
  pct1: number;
  pct2: number;
  acirrado: boolean;
  branding: TenantBranding;
}) {
  // Dimensoes Instagram Stories: 1080x1920.
  // pt/pb generosos pra respeitar a "safe zone" do IG: ~260px topo (username + X)
  // e ~260px base (caixa de resposta) — sao cortados no preview do feed.
  // Tipografia toda dimensionada pra leitura no celular (1080px de largura).
  return (
    <article
      className="flex flex-col px-14 relative text-white overflow-hidden"
      style={{
        width: 1080,
        height: 1920,
        paddingTop: 220,
        paddingBottom: 220,
        backgroundColor: "#0a2a5e",
        backgroundImage:
          "radial-gradient(circle at 50% 0%, rgba(255,215,0,0.18) 0%, transparent 55%), radial-gradient(circle at 50% 100%, rgba(0,168,89,0.12) 0%, transparent 50%)",
      }}
    >
      {/* Top: marca + nome da sub */}
      <div className="shrink-0">
        <div
          className="text-center uppercase tracking-[0.3em] font-bold opacity-90"
          style={{ fontSize: 32 }}
        >
          Melhores do Ano · {branding.nome}
        </div>
        {acirrado && (
          <div
            className="flex items-center justify-center gap-3 mt-3 text-amber-300 font-bold uppercase tracking-[0.2em]"
            style={{ fontSize: 28 }}
          >
            <Flame className="w-8 h-8" />
            acirrado
          </div>
        )}

        <h2
          className="font-display font-bold mt-6 leading-[1.0] text-center line-clamp-2"
          style={{ fontSize: 110 }}
        >
          {duelo.subcategoria_nome}
        </h2>

        <p
          className="font-light text-amber-300 mt-4 italic text-center"
          style={{ fontSize: 38 }}
        >
          Quem ainda vai virar o jogo?
        </p>
      </div>

      {/* Meio: duelo */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col items-center justify-center gap-4">
        <Lado
          nome={duelo.top1_nome}
          foto={duelo.top1_foto}
          pct={pct1}
          ganhando
          big
          fotoSize={170}
        />

        <div
          className="font-display italic text-amber-300 leading-none"
          style={{ fontSize: 60 }}
        >
          vs
        </div>

        <Lado
          nome={duelo.top2_nome}
          foto={duelo.top2_foto}
          pct={pct2}
          big
          fotoSize={170}
        />
      </div>

      {/* Bottom: barra + CTA */}
      <div className="shrink-0">
        <div className="h-7 rounded-full bg-white/15 overflow-hidden flex">
          <div className="bg-amber-300 h-full" style={{ width: `${pct1}%` }} />
          <div className="bg-white h-full" style={{ width: `${pct2}%` }} />
        </div>
        <div
          className="flex justify-between font-mono mt-3 opacity-90"
          style={{ fontSize: 28 }}
        >
          <span>{pct1.toFixed(1)}%</span>
          <span className="opacity-70">diferença de {duelo.diff_pct}%</span>
          <span>{pct2.toFixed(1)}%</span>
        </div>

        <p
          className="text-center font-bold leading-tight"
          style={{ fontSize: 56, marginTop: 36 }}
        >
          Ainda dá tempo de virar!
        </p>
        {branding.dominio ? (
          <p
            className="text-center text-amber-300 font-bold mt-2"
            style={{ fontSize: 42 }}
          >
            {branding.dominio}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function Lado({
  nome,
  foto,
  pct,
  ganhando,
  big,
  fotoSize,
}: {
  nome: string;
  foto: string | null;
  pct: number;
  ganhando?: boolean;
  big?: boolean;
  fotoSize: number;
}) {
  const inicial = nome.trim().charAt(0).toUpperCase() || "?";
  const borderClass = ganhando ? "border-amber-300" : "border-white/40";
  const pctColor = ganhando ? "text-amber-300" : "text-white";

  return (
    <div
      className={`min-w-0 flex flex-col items-center ${big ? "" : "flex-1"}`}
    >
      <div
        className={`relative rounded-full overflow-hidden border-4 ${borderClass} bg-white/10 flex items-center justify-center shrink-0`}
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
      <p
        className={`font-bold text-center line-clamp-2 leading-tight ${
          big ? "" : "text-sm mt-2"
        }`}
        style={big ? { fontSize: 38, marginTop: 14 } : undefined}
        title={nome}
      >
        {nome}
      </p>
      <p
        className={`font-display ${pctColor} leading-none ${
          big ? "" : "text-2xl mt-1"
        }`}
        style={big ? { fontSize: 72, marginTop: 6 } : undefined}
      >
        {pct.toFixed(1)}%
      </p>
    </div>
  );
}
