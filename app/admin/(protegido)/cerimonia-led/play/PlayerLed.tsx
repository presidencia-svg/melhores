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
  categoria: string | null;
  subcategoria: string | null;
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
          background: linear-gradient(135deg, #061d44 0%, #0a2a5e 55%, #143b7a 100%);
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color: #fbf8f1;
        }
        .led-gold {
          background: linear-gradient(180deg, #f3dfa3 0%, #e6bf5f 35%, #d4a537 65%, #8a6516 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
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
          {/* Moldura dourada unica (linha fina elegante) */}
          <div
            style={{
              position: "absolute",
              inset: "32px",
              border: "1.5px solid #d4a537",
              pointerEvents: "none",
            }}
          />

          {/* Conteudo em 3 colunas: CDL | logo redondo empresa | textos */}
          <div
            className="w-full h-full flex items-center relative"
            style={{ padding: "70px 100px", gap: "70px" }}
          >
            {/* COLUNA ESQUERDA: logo CDL + titulo */}
            <div
              className="flex flex-col items-center justify-center text-center"
              style={{ width: "360px" }}
            >
              {logoTenant ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoTenant}
                  alt={tenantNome}
                  style={{
                    maxHeight: "160px",
                    maxWidth: "280px",
                    objectFit: "contain",
                    filter: "brightness(0) invert(1)",
                  }}
                />
              ) : (
                <div
                  style={{
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontWeight: 700,
                    fontSize: "44px",
                    color: "#fbf8f1",
                  }}
                >
                  {tenantNome}
                </div>
              )}
              {/* Diamante dourado */}
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  background: "#d4a537",
                  transform: "rotate(45deg)",
                  margin: "40px 0 20px 0",
                }}
              />
              <p
                style={{
                  fontFamily: "var(--font-sora), system-ui, sans-serif",
                  fontSize: "20px",
                  letterSpacing: "0.32em",
                  color: "#d4a537",
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                PRÊMIO
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sora), system-ui, sans-serif",
                  fontSize: "20px",
                  letterSpacing: "0.32em",
                  color: "#d4a537",
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                MELHORES DO ANO
              </p>
              <p
                style={{
                  fontFamily: "var(--font-fraunces), Georgia, serif",
                  fontSize: "32px",
                  fontWeight: 700,
                  color: "#fbf8f1",
                  marginTop: "8px",
                  fontStyle: "italic",
                }}
              >
                {ano}
              </p>
            </div>

            {/* COLUNA CENTRAL: logo redondo da empresa em moldura dourada */}
            <div
              className="flex items-center justify-center shrink-0"
              style={{ width: "440px", height: "440px" }}
            >
              <div
                style={{
                  width: "420px",
                  height: "420px",
                  borderRadius: "50%",
                  background: "#fbf8f1",
                  border: "6px solid #d4a537",
                  boxShadow: "0 0 0 1px #8a6516, 0 0 40px rgba(212, 165, 55, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  padding: "30px",
                }}
              >
                {slide.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.logo_url}
                    alt={slide.empresa}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: "var(--font-fraunces), Georgia, serif",
                      fontStyle: "italic",
                      fontSize: "60px",
                      fontWeight: 700,
                      color: "#0a2a5e",
                      textAlign: "center",
                      lineHeight: 1.05,
                    }}
                  >
                    {slide.empresa
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 3)}
                  </span>
                )}
              </div>
            </div>

            {/* COLUNA DIREITA: subcategoria + nome empresa + @ */}
            <div className="flex-1 flex flex-col justify-center" style={{ minWidth: 0 }}>
              {slide.subcategoria && (
                <>
                  <p
                    style={{
                      fontFamily: "var(--font-sora), system-ui, sans-serif",
                      fontSize: "20px",
                      letterSpacing: "0.32em",
                      color: "#d4a537",
                      fontWeight: 500,
                      marginBottom: "8px",
                    }}
                  >
                    CATEGORIA
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-fraunces), Georgia, serif",
                      fontStyle: "italic",
                      fontSize: "38px",
                      fontWeight: 700,
                      color: "#fbf8f1",
                      lineHeight: 1.1,
                      marginBottom: "32px",
                    }}
                  >
                    {slide.subcategoria}
                  </p>
                </>
              )}
              <p
                style={{
                  fontFamily: "var(--font-fraunces), Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 700,
                  fontSize: slide.empresa.length > 30 ? "60px" : "76px",
                  lineHeight: 1.0,
                  color: "#fbf8f1",
                  textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
              >
                {slide.empresa}
              </p>
              {slide.instagram && (
                <p
                  style={{
                    fontFamily: "var(--font-sora), system-ui, sans-serif",
                    fontSize: "26px",
                    color: "#d4a537",
                    marginTop: "28px",
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
