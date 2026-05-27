"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Play, Pause, ArrowLeft, ArrowRight, Settings, Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import JSZip from "jszip";

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
  cidade,
}: {
  slides: SlidePlayer[];
  ano: number;
  tenantNome: string;
  logoTenant: string | null;
  cidade: string;
}) {
  const [idx, setIdx] = useState(0);
  const [tocando, setTocando] = useState(true);
  const [segundos, setSegundos] = useState(5);
  const [configAberto, setConfigAberto] = useState(false);
  // Scale dinamica pra preview na tela do laptop (LED real e 2048x768).
  const [scale, setScale] = useState(1);
  const [exportando, setExportando] = useState<{ atual: number; total: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Slides reordenados por categoria > subcategoria > empresa pro export
  const slidesOrdemCategoria = [...slides].sort((a, b) => {
    const ca = (a.categoria ?? "zzz").toLowerCase();
    const cb = (b.categoria ?? "zzz").toLowerCase();
    if (ca !== cb) return ca.localeCompare(cb, "pt-BR");
    const sa = (a.subcategoria ?? "").toLowerCase();
    const sb = (b.subcategoria ?? "").toLowerCase();
    if (sa !== sb) return sa.localeCompare(sb, "pt-BR");
    return a.empresa.localeCompare(b.empresa, "pt-BR");
  });

  async function exportarPNGs() {
    if (exportando) return;
    setTocando(false); // pausa auto-advance
    const idxOriginal = idx;
    const zip = new JSZip();
    const total = slidesOrdemCategoria.length;

    // Map id → posicao na lista ordenada (pra setIdx achar pelo id na lista original)
    const posOriginalPorId = new Map(slides.map((s, i) => [s.id, i]));

    try {
      for (let i = 0; i < total; i++) {
        const slideOrdenado = slidesOrdemCategoria[i]!;
        setExportando({ atual: i + 1, total });
        const posOriginal = posOriginalPorId.get(slideOrdenado.id) ?? 0;
        setIdx(posOriginal);

        // Aguarda o React renderizar + imagens carregarem
        await new Promise((r) => setTimeout(r, 600));

        if (!canvasRef.current) continue;
        const dataUrl = await toPng(canvasRef.current, {
          width: LED_W,
          height: LED_H,
          pixelRatio: 1,
          cacheBust: true,
          style: { transform: "scale(1)" },
        });
        const base64 = dataUrl.split(",")[1] ?? "";
        const catSafe = (slideOrdenado.categoria ?? "sem-categoria")
          .replace(/[^a-zA-Z0-9À-ú ]/g, "")
          .trim() || "sem-categoria";
        const empresaSafe = slideOrdenado.empresa
          .replace(/[^a-zA-Z0-9À-ú ]/g, "")
          .trim();
        const nome = `${String(i + 1).padStart(3, "0")} - ${catSafe} - ${empresaSafe}.png`;
        zip.file(nome, base64, { base64: true });
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `melhores-do-ano-${ano}-slides.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("[exportar] falhou:", e);
      alert(
        `Falha ao exportar: ${e instanceof Error ? e.message : "?"}\n\nDica: se os logos das empresas estão em outro domínio, o navegador pode bloquear a captura. Tente subir as logos pelo /admin/cerimonia-led.`
      );
    } finally {
      setExportando(null);
      setIdx(idxOriginal);
    }
  }

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
          background:
            radial-gradient(ellipse at 30% 40%, #143b7a 0%, transparent 60%),
            linear-gradient(135deg, #061d44 0%, #0a2a5e 100%);
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color: #fbf8f1;
          position: relative;
        }
      `}</style>

      {/* CANVAS LED REAL (2048x768) escalado pra caber na tela */}
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <div ref={canvasRef} className="led-canvas" style={{ width: LED_W, height: LED_H }}>
          {/* Moldura dourada fina */}
          <div
            style={{
              position: "absolute",
              inset: "26px",
              border: "1px solid #c9a24a",
              pointerEvents: "none",
            }}
          />

          {/* HEADER no topo: logo CDL + "PRÊMIO MELHORES DO ANO 2 0 2 5" */}
          <div
            style={{
              position: "absolute",
              top: "60px",
              left: "0",
              right: "0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "40px",
            }}
          >
            {logoTenant && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoTenant}
                alt={tenantNome}
                style={{
                  height: "76px",
                  width: "auto",
                  objectFit: "contain",
                }}
              />
            )}
            <p
              style={{
                fontFamily: "var(--font-sora), system-ui, sans-serif",
                fontSize: "44px",
                letterSpacing: "0.18em",
                color: "#d4a537",
                fontWeight: 700,
                lineHeight: 1,
                margin: 0,
              }}
            >
              PRÊMIO MELHORES DO ANO{" "}
              <span style={{ letterSpacing: "0.45em", marginLeft: "12px" }}>
                {String(ano).split("").join(" ")}
              </span>
            </p>
          </div>

          {/* COLUNA ESQUERDA: textos do vencedor — area segura ate antes do rodape */}
          <div
            style={{
              position: "absolute",
              left: "120px",
              top: "230px",
              width: "1100px",
              maxHeight: "470px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Linha curta dourada */}
            <div
              style={{
                width: "60px",
                height: "2px",
                background: "#d4a537",
                marginBottom: "16px",
                flexShrink: 0,
              }}
            />
            {/* CATEGORIA kicker */}
            <p
              style={{
                fontFamily: "var(--font-sora), system-ui, sans-serif",
                fontSize: "26px",
                letterSpacing: "0.4em",
                color: "#d4a537",
                fontWeight: 600,
                margin: 0,
                marginBottom: "26px",
                flexShrink: 0,
              }}
            >
              CATEGORIA
            </p>
            {/* Subcategoria em creme italic — so renderiza quando existe */}
            {slide.subcategoria && (
              <p
                style={{
                  fontFamily: "var(--font-fraunces), Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: "60px",
                  lineHeight: 1.0,
                  color: "#fbf8f1",
                  margin: 0,
                  marginBottom: "50px",
                  flexShrink: 0,
                }}
              >
                {slide.subcategoria}
              </p>
            )}
            {/* Nome da empresa em dourado italic GRANDE — auto-scale por length */}
            <p
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontStyle: "italic",
                fontWeight: 700,
                fontSize:
                  slide.empresa.length > 40
                    ? "62px"
                    : slide.empresa.length > 24
                      ? "82px"
                      : "104px",
                lineHeight: 1.0,
                margin: 0,
                marginBottom: "30px",
                flexShrink: 0,
                background:
                  "linear-gradient(180deg, #f3dfa3 0%, #e6bf5f 30%, #d4a537 60%, #b88a2a 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
              }}
            >
              {slide.empresa}
            </p>
            {/* @ Instagram — auto-scale + word-break pra nao colidir com rodape */}
            {slide.instagram && (
              <p
                style={{
                  fontFamily: "var(--font-sora), system-ui, sans-serif",
                  fontSize:
                    slide.instagram.length > 60
                      ? "18px"
                      : slide.instagram.length > 40
                        ? "22px"
                        : "26px",
                  color: "#fbf8f1",
                  fontWeight: 400,
                  margin: 0,
                  lineHeight: 1.3,
                  wordBreak: "break-word",
                  flexShrink: 1,
                  minHeight: 0,
                }}
              >
                {slide.instagram}
              </p>
            )}
          </div>

          {/* COLUNA DIREITA: circulo branco GRANDE com logo da empresa */}
          <div
            style={{
              position: "absolute",
              right: "100px",
              top: "150px",
            }}
          >
            <div
              style={{
                width: "560px",
                height: "560px",
                borderRadius: "50%",
                background: "#fbf8f1",
                border: "4px solid #d4a537",
                boxShadow: "0 0 0 1px #8a6516",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                padding: "110px",
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
                  crossOrigin="anonymous"
                />
              ) : (
                <span
                  style={{
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontStyle: "italic",
                    fontSize: "120px",
                    fontWeight: 700,
                    color: "#0a2a5e",
                    textAlign: "center",
                    lineHeight: 1.0,
                  }}
                >
                  {slide.empresa
                    .split(" ")
                    .filter((w) => w.length > 1)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 3)}
                </span>
              )}
            </div>
          </div>

          {/* FOOTER: "CERIMONIA DE PREMIACAO · ARACAJU/SE" + contador */}
          <div
            style={{
              position: "absolute",
              bottom: "55px",
              left: "120px",
              right: "100px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sora), system-ui, sans-serif",
                fontSize: "16px",
                letterSpacing: "0.35em",
                color: "#fbf8f1",
                opacity: 0.85,
                fontWeight: 500,
                margin: 0,
              }}
            >
              CERIMÔNIA DE PREMIAÇÃO · {cidade.toUpperCase()}
            </p>
            <p
              style={{
                fontFamily: "var(--font-sora), system-ui, sans-serif",
                fontSize: "16px",
                letterSpacing: "0.2em",
                color: "#fbf8f1",
                opacity: 0.85,
                fontWeight: 500,
                margin: 0,
              }}
            >
              {String(idx + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </p>
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
        <button
          onClick={exportarPNGs}
          disabled={!!exportando}
          title="Exportar todas as telas como PNGs em ordem de categoria (zip)"
          className="h-9 px-3 rounded-full flex items-center gap-2 hover:bg-white/10 disabled:opacity-50"
        >
          {exportando ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="text-xs whitespace-nowrap">
            {exportando ? `${exportando.atual}/${exportando.total}` : "Exportar"}
          </span>
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
