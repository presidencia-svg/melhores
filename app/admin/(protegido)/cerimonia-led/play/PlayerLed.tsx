"use client";

import { useEffect, useState, useCallback } from "react";
import { Play, Pause, ArrowLeft, ArrowRight, Settings } from "lucide-react";

export type SlidePlayer = {
  id: string;
  ordem: number;
  empresa: string;
  recebe: string | null;
  instagram: string | null;
  logo_url: string | null;
};

const LED_W = 2048;
const LED_H = 768;

export function PlayerLed({
  slides,
  ano,
  tenantNome,
  logoTenant,
}: {
  slides: SlidePlayer[];
  ano: number;
  tenantNome: string;
  logoTenant: string | null;
}) {
  const [idx, setIdx] = useState(0);
  const [tocando, setTocando] = useState(true);
  const [segundos, setSegundos] = useState(5);
  const [configAberto, setConfigAberto] = useState(false);
  // Scale dinamica pra preview na tela do laptop (LED real e 2048x768).
  const [scale, setScale] = useState(1);

  const ir = useCallback(
    (delta: number) => {
      setIdx((prev) => {
        const n = prev + delta;
        if (n < 0) return slides.length - 1;
        if (n >= slides.length) return 0;
        return n;
      });
    },
    [slides.length]
  );

  // Auto-avanco
  useEffect(() => {
    if (!tocando) return;
    const t = setTimeout(() => ir(1), segundos * 1000);
    return () => clearTimeout(t);
  }, [idx, tocando, segundos, ir]);

  // Teclado
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setTocando((v) => !v);
      } else if (e.key === "ArrowRight") {
        ir(1);
      } else if (e.key === "ArrowLeft") {
        ir(-1);
      } else if (e.key === "Escape") {
        if (document.fullscreenElement) document.exitFullscreen();
      } else if (e.key.toLowerCase() === "f") {
        if (!document.fullscreenElement)
          document.documentElement.requestFullscreen();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [ir]);

  // Calcula scale pra caber na viewport (preview na tela do laptop)
  useEffect(() => {
    function recalc() {
      const sw = window.innerWidth - 40;
      const sh = window.innerHeight - 40;
      const s = Math.min(sw / LED_W, sh / LED_H, 1);
      setScale(s);
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  const slide = slides[idx];
  if (!slide) return null;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* CSS pra forcar print/screen-capture com cores exatas */}
      <style>{`
        .led-canvas {
          width: ${LED_W}px;
          height: ${LED_H}px;
          background: radial-gradient(ellipse at 50% 40%, #fafafa 0%, #d8d8d8 100%);
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `}</style>

      {/* CANVAS LED REAL (2048x768) escalado pra caber na tela */}
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <div className="led-canvas relative" style={{ width: LED_W, height: LED_H }}>
          {/* Moldura dourada dupla */}
          <div
            style={{
              position: "absolute",
              inset: "20px",
              border: "3px solid #c9a24a",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "32px",
              border: "1px solid #c9a24a",
            }}
          />

          {/* Conteudo em grid horizontal: lado esquerdo (CDL) | centro (empresa) | lado direito (@ + ano) */}
          <div
            className="w-full h-full flex items-stretch relative"
            style={{ padding: "60px 80px" }}
          >
            {/* COLUNA ESQUERDA: logo CDL + titulo */}
            <div
              className="flex flex-col items-center justify-center text-center"
              style={{ width: "420px" }}
            >
              {logoTenant ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoTenant}
                  alt={tenantNome}
                  style={{
                    maxHeight: "180px",
                    maxWidth: "320px",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <div
                  className="font-display font-bold text-navy-800"
                  style={{ fontSize: "48px" }}
                >
                  {tenantNome}
                </div>
              )}
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  background: "#c9a24a",
                  transform: "rotate(45deg)",
                  margin: "30px 0 18px 0",
                }}
              />
              <p
                style={{
                  fontSize: "22px",
                  letterSpacing: "0.32em",
                  color: "#4a4a4a",
                  fontWeight: 500,
                }}
              >
                PRÊMIO MELHORES
              </p>
              <p
                style={{
                  fontSize: "22px",
                  letterSpacing: "0.32em",
                  color: "#4a4a4a",
                  fontWeight: 500,
                }}
              >
                DO ANO {ano}
              </p>
            </div>

            {/* DIVISOR VERTICAL OURO */}
            <div
              style={{
                width: "1px",
                background: "#c9a24a",
                margin: "20px 60px",
              }}
            />

            {/* COLUNA CENTRAL: logo empresa + nome */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              {slide.logo_url ? (
                <div
                  className="flex items-center justify-center"
                  style={{ height: "280px", marginBottom: "30px" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.logo_url}
                    alt={slide.empresa}
                    style={{
                      maxHeight: "280px",
                      maxWidth: "700px",
                      objectFit: "contain",
                    }}
                  />
                </div>
              ) : null}
              <p
                className="font-display-bold text-navy-800 italic"
                style={{
                  fontSize: slide.empresa.length > 30 ? "56px" : "72px",
                  lineHeight: 1.05,
                  maxWidth: "900px",
                }}
              >
                {slide.empresa}
              </p>
              {slide.instagram && (
                <p
                  className="text-zinc-700"
                  style={{
                    fontSize: "32px",
                    marginTop: "24px",
                    letterSpacing: "0.05em",
                  }}
                >
                  {slide.instagram}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLES DE TELA (escondidos em fullscreen quando tocando) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/70 backdrop-blur text-white rounded-full px-4 py-2 z-50">
        <button
          onClick={() => ir(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTocando((v) => !v)}
          className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200"
        >
          {tocando ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={() => ir(1)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <span className="font-mono text-xs px-2 tabular-nums">
          {idx + 1} / {slides.length}
        </span>
        <button
          onClick={() => setConfigAberto((v) => !v)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {configAberto && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur text-white rounded-lg p-4 z-50 text-sm space-y-3 w-72">
          <div>
            <label className="block text-xs text-white/60 mb-1">
              Tempo por slide: <strong>{segundos}s</strong>
            </label>
            <input
              type="range"
              min={2}
              max={20}
              value={segundos}
              onChange={(e) => setSegundos(parseInt(e.target.value, 10))}
              className="w-full"
            />
          </div>
          <p className="text-[11px] text-white/60 leading-relaxed">
            <strong>Atalhos:</strong> espaço = play/pause · ← → = navegar · F =
            fullscreen · ESC = sai do fullscreen
          </p>
          <p className="text-[11px] text-white/60 leading-relaxed">
            Pra gravar: aperte <kbd>F</kbd> pra fullscreen, dispare o OBS pra
            capturar a janela inteira (resolução de origem 2048×768).
          </p>
        </div>
      )}
    </div>
  );
}
