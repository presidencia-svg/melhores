"use client";

// Tres variantes de certificado de premiacao Melhores do Ano.
// Tamanho fixo 1320x1020 (proporcao 11:8.5 = carta paisagem). Print escala
// pra letter landscape automaticamente — texto e SVG ficam vetoriais no PDF.
//
// Portado dos prototipos do Claude Design (certificado-2025.jsx e
// certificado-2025-variacoes.jsx). Logo do tenant em /cdl-logo.png.

export type Variante = "navy" | "cream" | "gala";

export const CERT_W = 1320;
export const CERT_H = 1020;

export type CertificadoProps = {
  vencedor: string;
  categoria: string;
  numero: string;
  signatario: string;
  cargo: string;
  cidade: string;
  ano: number;
  edicao: string; // ex: "34ª edição"
  nomeOrgao: string; // ex: "Câmara de Dirigentes Lojistas · Aracaju"
  dominio: string;
  logoSrc?: string;
};

export const VARIANTES: Record<Variante, { nome: string; Componente: React.ComponentType<CertificadoProps> }> = {
  navy: { nome: "A · Navy moderno luxo", Componente: CertificadoNavy },
  cream: { nome: "B · Cream editorial", Componente: CertificadoCream },
  gala: { nome: "C · Clássico de gala", Componente: CertificadoGala },
};

// =====================================================================
// VARIANTE A — Navy moderno luxo
// =====================================================================

const FONT_DISPLAY = "var(--font-fraunces), Georgia, serif";
const FONT_SANS = "var(--font-sora), system-ui, sans-serif";
const FONT_MONO = "var(--font-jetbrains), ui-monospace, monospace";
const FONT_SIGN = "var(--font-pinyon), 'Snell Roundhand', cursive";

function CornerOrnament({
  size = 130,
  flipX = false,
  flipY = false,
}: {
  size?: number;
  flipX?: boolean;
  flipY?: boolean;
}) {
  const color = "#d4a537";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        transform: `${flipX ? "scaleX(-1) " : ""}${flipY ? "scaleY(-1)" : ""}`,
        transformOrigin: "center",
      }}
    >
      <path d="M 4 96 L 4 4 L 96 4" stroke={color} strokeWidth="0.6" fill="none" opacity="0.95" />
      <path d="M 10 96 L 10 10 L 96 10" stroke={color} strokeWidth="0.25" fill="none" opacity="0.65" />
      <path d="M 4 4 L 22 4 L 4 22 Z" fill={color} opacity="0.18" />
      <g transform="translate(16 16)">
        <path d="M 0 -5 L 5 0 L 0 5 L -5 0 Z" fill={color} opacity="0.9" />
        <circle cx="0" cy="0" r="1.5" fill="#0a2a5e" />
      </g>
      <path d="M 28 10 L 60 10" stroke={color} strokeWidth="0.3" opacity="0.5" />
      <path d="M 10 28 L 10 60" stroke={color} strokeWidth="0.3" opacity="0.5" />
      <g transform="translate(60 10)" opacity="0.7">
        <path d="M 0 -2 L 0.6 -0.6 L 2 0 L 0.6 0.6 L 0 2 L -0.6 0.6 L -2 0 L -0.6 -0.6 Z" fill={color} />
      </g>
      <g transform="translate(10 60)" opacity="0.7">
        <path d="M 0 -2 L 0.6 -0.6 L 2 0 L 0.6 0.6 L 0 2 L -0.6 0.6 L -2 0 L -0.6 -0.6 Z" fill={color} />
      </g>
    </svg>
  );
}

export function CertificadoNavy({
  vencedor,
  categoria,
  numero,
  signatario,
  cargo,
  cidade,
  ano,
  edicao,
  nomeOrgao,
  dominio,
  logoSrc = "/cdl-logo.png",
}: CertificadoProps) {
  return (
    <div
      style={{
        width: CERT_W,
        height: CERT_H,
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #061d44 0%, #0a2a5e 50%, #0c2456 100%)",
        color: "#fbf8f1",
        fontFamily: FONT_SANS,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.06,
          pointerEvents: "none",
          backgroundImage: `repeating-linear-gradient(45deg, #d4a537 0 1px, transparent 1px 18px), repeating-linear-gradient(-45deg, #d4a537 0 1px, transparent 1px 18px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
          pointerEvents: "none",
          backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
          mixBlendMode: "overlay",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 32,
          border: "1.5px solid rgba(212,165,55,0.85)",
          boxShadow:
            "inset 0 0 0 6px rgba(10,42,94,0.4), inset 0 0 0 7px rgba(212,165,55,0.35)",
        }}
      />
      <div style={{ position: "absolute", inset: 50, border: "0.6px solid rgba(212,165,55,0.5)" }} />

      <div style={{ position: "absolute", top: 36, left: 36 }}>
        <CornerOrnament size={130} />
      </div>
      <div style={{ position: "absolute", top: 36, right: 36 }}>
        <CornerOrnament size={130} flipX />
      </div>
      <div style={{ position: "absolute", bottom: 36, left: 36 }}>
        <CornerOrnament size={130} flipY />
      </div>
      <div style={{ position: "absolute", bottom: 36, right: 36 }}>
        <CornerOrnament size={130} flipX flipY />
      </div>

      <div
        style={{
          position: "absolute",
          top: 90,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ background: "#fbf8f1", padding: "5px 11px", borderRadius: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="CDL" style={{ height: 24, display: "block" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 30, height: 1, background: "rgba(212,165,55,0.6)" }} />
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              letterSpacing: "0.5em",
              color: "#e6bf5f",
              fontWeight: 500,
              textTransform: "uppercase",
            }}
          >
            {nomeOrgao}
          </div>
          <div style={{ width: 30, height: 1, background: "rgba(212,165,55,0.6)" }} />
        </div>
      </div>

      <div style={{ position: "absolute", top: 175, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 34,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(251,248,241,0.85)",
          }}
        >
          Certificado
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 800,
            fontSize: 78,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            background: "linear-gradient(180deg, #f3dfa3 0%, #e6bf5f 40%, #d4a537 70%, #b88a2a 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "0 2px 12px rgba(212,165,55,0.18)",
          }}
        >
          Melhores do Ano
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: FONT_MONO,
            fontSize: 11,
            letterSpacing: "0.55em",
            color: "rgba(212,165,55,0.85)",
            fontWeight: 500,
            textTransform: "uppercase",
          }}
        >
          Edição {ano}  ·  {edicao}
        </div>
      </div>

      <div style={{ position: "absolute", top: 360, left: 180, right: 180, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 17,
            lineHeight: 1.6,
            color: "rgba(251,248,241,0.78)",
            letterSpacing: "0.01em",
          }}
        >
          A {nomeOrgao}, no exercício de sua tradicional homenagem àqueles que se
          destacaram no comércio, na prestação de serviços e na vida da nossa cidade,
          confere o presente título a
        </div>
      </div>

      <div style={{ position: "absolute", top: 478, left: 80, right: 80, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: 64,
            lineHeight: 1,
            letterSpacing: "-0.015em",
            color: "#fbf8f1",
            textShadow: "0 2px 24px rgba(0,0,0,0.4)",
          }}
        >
          {vencedor}
        </div>
        <div
          style={{
            marginTop: 22,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ width: 80, height: 1, background: "linear-gradient(90deg, transparent, #d4a537)" }} />
          <div
            style={{
              width: 8,
              height: 8,
              transform: "rotate(45deg)",
              background: "linear-gradient(135deg, #f3dfa3, #b88a2a)",
              boxShadow: "0 0 8px rgba(230,191,95,0.6)",
            }}
          />
          <div style={{ width: 200, height: 1, background: "#d4a537" }} />
          <div
            style={{
              width: 8,
              height: 8,
              transform: "rotate(45deg)",
              background: "linear-gradient(135deg, #f3dfa3, #b88a2a)",
              boxShadow: "0 0 8px rgba(230,191,95,0.6)",
            }}
          />
          <div style={{ width: 80, height: 1, background: "linear-gradient(-90deg, transparent, #d4a537)" }} />
        </div>
      </div>

      <div style={{ position: "absolute", top: 615, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            letterSpacing: "0.55em",
            color: "rgba(212,165,55,0.85)",
            fontWeight: 500,
            textTransform: "uppercase",
          }}
        >
          vencedor da categoria
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 36,
            letterSpacing: "0.01em",
            color: "#e6bf5f",
            textShadow: "0 1px 8px rgba(212,165,55,0.25)",
          }}
        >
          {categoria}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 110,
          left: 100,
          right: 100,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "end",
          gap: 40,
        }}
      >
        <div style={{ textAlign: "center", paddingBottom: 4 }}>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 22,
              color: "#fbf8f1",
              lineHeight: 1.1,
            }}
          >
            {cidade} · Sergipe
          </div>
          <div
            style={{
              marginTop: 10,
              paddingTop: 8,
              borderTop: "0.6px solid rgba(212,165,55,0.4)",
              fontFamily: FONT_MONO,
              fontSize: 10,
              letterSpacing: "0.4em",
              color: "rgba(251,248,241,0.55)",
              textTransform: "uppercase",
            }}
          >
            {ano}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            paddingBottom: 6,
          }}
        >
          <svg width="200" height="140" viewBox="0 0 200 140">
            <defs>
              <linearGradient id="emblemGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f3dfa3" />
                <stop offset="40%" stopColor="#e6bf5f" />
                <stop offset="70%" stopColor="#d4a537" />
                <stop offset="100%" stopColor="#8a6516" />
              </linearGradient>
            </defs>
            <g transform="translate(100 90)">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                const y = -42 + i * 12;
                const xOff = -28 - Math.abs(Math.sin(i * 0.7)) * 4;
                const r = -50 - i * 4;
                return (
                  <ellipse
                    key={"l" + i}
                    cx={xOff}
                    cy={y}
                    rx="2.4"
                    ry="7"
                    fill="url(#emblemGold)"
                    opacity="0.95"
                    transform={`rotate(${r} ${xOff} ${y})`}
                  />
                );
              })}
              {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                const y = -42 + i * 12;
                const xOff = 28 + Math.abs(Math.sin(i * 0.7)) * 4;
                const r = 50 + i * 4;
                return (
                  <ellipse
                    key={"r" + i}
                    cx={xOff}
                    cy={y}
                    rx="2.4"
                    ry="7"
                    fill="url(#emblemGold)"
                    opacity="0.95"
                    transform={`rotate(${r} ${xOff} ${y})`}
                  />
                );
              })}
              <path d="M -22 38 Q 0 50 22 38" stroke="url(#emblemGold)" strokeWidth="1.4" fill="none" />
              <path d="M -22 38 L -28 48 L -16 42" stroke="url(#emblemGold)" strokeWidth="1.2" fill="none" />
              <path d="M 22 38 L 28 48 L 16 42" stroke="url(#emblemGold)" strokeWidth="1.2" fill="none" />
            </g>
            <g transform="translate(100 16)">
              <path
                d="M 0 -10 L 2.5 -3 L 10 -3 L 4 1.5 L 6.5 9 L 0 4.5 L -6.5 9 L -4 1.5 L -10 -3 L -2.5 -3 Z"
                fill="url(#emblemGold)"
              />
            </g>
            <text
              x="100"
              y="78"
              textAnchor="middle"
              fontFamily={FONT_DISPLAY}
              fontStyle="italic"
              fontWeight="800"
              fontSize="46"
              fill="url(#emblemGold)"
              letterSpacing="-2"
            >
              MdA
            </text>
            <text
              x="100"
              y="100"
              textAnchor="middle"
              fontFamily={FONT_MONO}
              fontWeight="500"
              fontSize="9"
              fill="url(#emblemGold)"
              letterSpacing="3"
            >
              {ano}
            </text>
          </svg>
        </div>

        <div style={{ textAlign: "center", paddingBottom: 4 }}>
          <div
            style={{
              height: 48,
              marginBottom: 4,
              fontFamily: FONT_SIGN,
              fontSize: 46,
              color: "#e6bf5f",
              opacity: 0.95,
              lineHeight: 1,
              letterSpacing: "0.01em",
              textShadow: "0 1px 6px rgba(212,165,55,0.25)",
            }}
          >
            {signatario}
          </div>
          <div
            style={{
              paddingTop: 8,
              borderTop: "0.6px solid rgba(212,165,55,0.6)",
              fontFamily: FONT_DISPLAY,
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: 18,
              color: "#fbf8f1",
            }}
          >
            {signatario}
          </div>
          <div
            style={{
              marginTop: 4,
              fontFamily: FONT_MONO,
              fontSize: 10,
              letterSpacing: "0.4em",
              color: "rgba(212,165,55,0.85)",
              textTransform: "uppercase",
            }}
          >
            {cargo}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            fontFamily: FONT_MONO,
            fontSize: 9,
            letterSpacing: "0.4em",
            color: "rgba(212,165,55,0.6)",
            textTransform: "uppercase",
          }}
        >
          <span>{numero}</span>
          <span style={{ width: 4, height: 4, background: "#d4a537", transform: "rotate(45deg)" }} />
          <span>autenticidade · {dominio || "cdlaju.com.br"}</span>
          <span style={{ width: 4, height: 4, background: "#d4a537", transform: "rotate(45deg)" }} />
          <span>{edicao}</span>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// VARIANTE B — Cream editorial
// =====================================================================

export function CertificadoCream({
  vencedor,
  categoria,
  numero,
  signatario,
  cargo,
  cidade,
  ano,
  edicao,
  nomeOrgao,
  dominio,
  logoSrc = "/cdl-logo.png",
}: CertificadoProps) {
  return (
    <div
      style={{
        width: CERT_W,
        height: CERT_H,
        position: "relative",
        overflow: "hidden",
        background: "#f5f1e8",
        color: "#0a2a5e",
        fontFamily: FONT_SANS,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.05,
          pointerEvents: "none",
          backgroundImage: "radial-gradient(#0a2a5e 1px, transparent 1px)",
          backgroundSize: "5px 5px",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 100,
          bottom: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 800,
            fontSize: 720,
            color: "rgba(184,138,42,0.06)",
            letterSpacing: "-0.05em",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          M
        </div>
      </div>

      <div style={{ position: "absolute", inset: 28, border: "1px solid rgba(10,42,94,0.85)" }} />
      <div style={{ position: "absolute", inset: 38, border: "0.5px solid rgba(184,138,42,0.6)" }} />

      <div
        style={{
          position: "absolute",
          top: 70,
          left: 80,
          right: 80,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: 18,
          borderBottom: "0.5px solid rgba(10,42,94,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ background: "#0a2a5e", padding: "5px 10px", borderRadius: 2 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="CDL"
              style={{ height: 22, display: "block", filter: "brightness(0) invert(1)" }}
            />
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              letterSpacing: "0.45em",
              color: "#b88a2a",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {nomeOrgao}
          </div>
        </div>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: "0.4em",
            color: "rgba(10,42,94,0.6)",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Certificado de Premiação · {ano}
        </div>
      </div>

      <div style={{ position: "absolute", top: 145, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 60, height: 0.5, background: "#b88a2a" }} />
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              letterSpacing: "0.55em",
              color: "#b88a2a",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {edicao} · troféu da excelência
          </div>
          <div style={{ width: 60, height: 0.5, background: "#b88a2a" }} />
        </div>
      </div>

      <div style={{ position: "absolute", top: 195, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 120,
            lineHeight: 0.92,
            letterSpacing: "-0.03em",
            color: "#0a2a5e",
          }}
        >
          Melhores <span style={{ fontWeight: 800, color: "#b88a2a" }}>do Ano</span>
        </div>
      </div>

      <div style={{ position: "absolute", top: 380, left: 220, right: 220, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 16,
            lineHeight: 1.65,
            color: "rgba(10,42,94,0.78)",
          }}
        >
          A {nomeOrgao} confere o presente título à pessoa abaixo nomeada,
          em reconhecimento à sua excelência e contribuição ao comércio e à vida da nossa cidade —
        </div>
      </div>

      <div style={{ position: "absolute", top: 510, left: 60, right: 60, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: 78,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: "#0a2a5e",
          }}
        >
          {vencedor}
        </div>
      </div>

      <div style={{ position: "absolute", top: 640, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 50, height: 1, background: "#0a2a5e" }} />
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              letterSpacing: "0.5em",
              color: "rgba(10,42,94,0.7)",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            vencedor da categoria
          </div>
          <div style={{ width: 50, height: 1, background: "#0a2a5e" }} />
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 32,
            color: "#b88a2a",
          }}
        >
          {categoria}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 110,
          left: 110,
          right: 110,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "end",
          gap: 40,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 22,
              color: "#0a2a5e",
            }}
          >
            {cidade} · Sergipe
          </div>
          <div
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: "0.5px solid rgba(10,42,94,0.4)",
              fontFamily: FONT_MONO,
              fontSize: 9,
              letterSpacing: "0.4em",
              color: "rgba(10,42,94,0.55)",
              textTransform: "uppercase",
            }}
          >
            {ano}
          </div>
        </div>

        <div
          style={{
            width: 140,
            height: 140,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="140" height="140" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="sealCream" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d4a537" />
                <stop offset="100%" stopColor="#8a6516" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="92" fill="none" stroke="url(#sealCream)" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="86" fill="none" stroke="url(#sealCream)" strokeWidth="0.4" opacity="0.6" />
            <circle cx="100" cy="100" r="74" fill="rgba(184,138,42,0.08)" />
            <circle cx="100" cy="100" r="74" fill="none" stroke="url(#sealCream)" strokeWidth="0.8" />
            {Array.from({ length: 36 }).map((_, i) => {
              const a = (i * 10 * Math.PI) / 180;
              return (
                <line
                  key={i}
                  x1={100 + Math.cos(a) * 88}
                  y1={100 + Math.sin(a) * 88}
                  x2={100 + Math.cos(a) * 91}
                  y2={100 + Math.sin(a) * 91}
                  stroke="url(#sealCream)"
                  strokeWidth="0.5"
                  opacity="0.85"
                />
              );
            })}
            <defs>
              <path id="circT2" d="M 100 100 m -60 0 a 60 60 0 0 1 120 0" />
              <path id="circB2" d="M 100 100 m -60 0 a 60 60 0 0 0 120 0" />
            </defs>
            <text fill="#b88a2a" fontFamily={FONT_SANS} fontSize="9" letterSpacing="3" fontWeight="700">
              <textPath href="#circT2" startOffset="50%" textAnchor="middle">
                ★ MELHORES DO ANO ★
              </textPath>
            </text>
            <text fill="#b88a2a" fontFamily={FONT_SANS} fontSize="8" letterSpacing="2.5" fontWeight="500">
              <textPath href="#circB2" startOffset="50%" textAnchor="middle">
                {`${nomeOrgao.toUpperCase()} · ${ano}`}
              </textPath>
            </text>
            <g transform="translate(100 110)">
              {[0, 1, 2, 3, 4].map((i) => {
                const y = -22 + i * 10;
                return (
                  <g key={i}>
                    <ellipse
                      cx={-22 - Math.abs(Math.sin(i)) * 2}
                      cy={y}
                      rx="2"
                      ry="5.5"
                      fill="#b88a2a"
                      opacity="0.9"
                      transform={`rotate(${-45 - i * 5})`}
                    />
                    <ellipse
                      cx={22 + Math.abs(Math.sin(i)) * 2}
                      cy={y}
                      rx="2"
                      ry="5.5"
                      fill="#b88a2a"
                      opacity="0.9"
                      transform={`rotate(${45 + i * 5})`}
                    />
                  </g>
                );
              })}
            </g>
            <text
              x="100"
              y="98"
              textAnchor="middle"
              fontFamily={FONT_DISPLAY}
              fontStyle="italic"
              fontWeight="800"
              fontSize="44"
              fill="#b88a2a"
              letterSpacing="-2"
            >
              MdA
            </text>
          </svg>
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              height: 46,
              marginBottom: 0,
              fontFamily: FONT_SIGN,
              fontSize: 44,
              color: "#0a2a5e",
              lineHeight: 1,
              letterSpacing: "0.01em",
            }}
          >
            {signatario}
          </div>
          <div
            style={{
              paddingTop: 6,
              borderTop: "0.5px solid rgba(10,42,94,0.85)",
              fontFamily: FONT_DISPLAY,
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: 17,
              color: "#0a2a5e",
            }}
          >
            {signatario}
          </div>
          <div
            style={{
              marginTop: 4,
              fontFamily: FONT_MONO,
              fontSize: 9,
              letterSpacing: "0.4em",
              color: "#b88a2a",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {cargo}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            fontFamily: FONT_MONO,
            fontSize: 9,
            letterSpacing: "0.4em",
            color: "rgba(10,42,94,0.5)",
            textTransform: "uppercase",
          }}
        >
          <span>{numero}</span>
          <span style={{ width: 4, height: 4, background: "#b88a2a", transform: "rotate(45deg)" }} />
          <span>autenticidade · {dominio || "cdlaju.com.br"}</span>
          <span style={{ width: 4, height: 4, background: "#b88a2a", transform: "rotate(45deg)" }} />
          <span>{edicao}</span>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// VARIANTE C — Classico de gala
// =====================================================================

export function CertificadoGala({
  vencedor,
  categoria,
  numero,
  signatario,
  cargo,
  cidade,
  ano,
  edicao,
  nomeOrgao,
  dominio,
  logoSrc = "/cdl-logo.png",
}: CertificadoProps) {
  return (
    <div
      style={{
        width: CERT_W,
        height: CERT_H,
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #fbf6e8 0%, #f5ecd5 50%, #efe2c0 100%)",
        color: "#0a2a5e",
        fontFamily: FONT_SANS,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.18,
          pointerEvents: "none",
          backgroundImage: "radial-gradient(rgba(184,138,42,0.4) 1px, transparent 1px)",
          backgroundSize: "4px 4px",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, transparent 60%)",
        }}
      />

      <svg
        width={CERT_W}
        height={CERT_H}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <defs>
          <linearGradient id="ornGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3dfa3" />
            <stop offset="40%" stopColor="#d4a537" />
            <stop offset="70%" stopColor="#b88a2a" />
            <stop offset="100%" stopColor="#8a6516" />
          </linearGradient>
        </defs>

        <rect x="32" y="32" width={CERT_W - 64} height={CERT_H - 64} fill="none" stroke="url(#ornGold)" strokeWidth="3" />
        <rect x="42" y="42" width={CERT_W - 84} height={CERT_H - 84} fill="none" stroke="url(#ornGold)" strokeWidth="0.8" />
        <rect x="56" y="56" width={CERT_W - 112} height={CERT_H - 112} fill="none" stroke="url(#ornGold)" strokeWidth="0.4" opacity="0.6" />

        {[
          { x: 56, y: 56, sx: 1, sy: 1 },
          { x: CERT_W - 56, y: 56, sx: -1, sy: 1 },
          { x: 56, y: CERT_H - 56, sx: 1, sy: -1 },
          { x: CERT_W - 56, y: CERT_H - 56, sx: -1, sy: -1 },
        ].map((c, i) => (
          <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.sx} ${c.sy})`}>
            <path
              d="M 0 0 Q 60 10, 80 30 Q 100 50, 110 90"
              stroke="url(#ornGold)"
              strokeWidth="1"
              fill="none"
              opacity="0.85"
            />
            <path
              d="M 0 0 Q 10 60, 30 80 Q 50 100, 90 110"
              stroke="url(#ornGold)"
              strokeWidth="1"
              fill="none"
              opacity="0.85"
            />
            {[20, 40, 60, 80].map((t) => (
              <g
                key={t}
                transform={`translate(${20 + Math.cos(t / 30) * 8} ${10 + t}) rotate(${t * 2})`}
              >
                <ellipse cx="0" cy="0" rx="1.5" ry="5" fill="url(#ornGold)" opacity="0.8" />
              </g>
            ))}
            {[20, 40, 60, 80].map((t) => (
              <g
                key={"h" + t}
                transform={`translate(${10 + t} ${20 + Math.cos(t / 30) * 8}) rotate(${t * 2 - 90})`}
              >
                <ellipse cx="0" cy="0" rx="1.5" ry="5" fill="url(#ornGold)" opacity="0.8" />
              </g>
            ))}
            <g transform="translate(20 20)">
              <path d="M 0 -8 L 8 0 L 0 8 L -8 0 Z" fill="url(#ornGold)" />
              <circle cx="0" cy="0" r="3" fill="#0a2a5e" />
              <circle cx="0" cy="0" r="1" fill="url(#ornGold)" />
            </g>
          </g>
        ))}

        <g transform={`translate(${CERT_W / 2} 56)`}>
          <path d="M -90 0 L -50 0 M 50 0 L 90 0" stroke="url(#ornGold)" strokeWidth="1" />
          <path d="M -45 0 Q -30 -20, 0 -22 Q 30 -20, 45 0" stroke="url(#ornGold)" strokeWidth="1.2" fill="none" />
          <g transform="translate(0 -20)">
            <path
              d="M 0 -8 L 4 -2 L 10 -3 L 6 3 L 8 9 L 0 5 L -8 9 L -6 3 L -10 -3 L -4 -2 Z"
              fill="url(#ornGold)"
            />
          </g>
          {[-30, -15, 15, 30].map((x) => (
            <circle key={x} cx={x} cy="-10" r="2" fill="url(#ornGold)" />
          ))}
        </g>

        <g transform={`translate(${CERT_W / 2} ${CERT_H - 56})`}>
          <path d="M -90 0 L -50 0 M 50 0 L 90 0" stroke="url(#ornGold)" strokeWidth="1" />
          <path d="M -45 0 Q -30 18, 0 20 Q 30 18, 45 0" stroke="url(#ornGold)" strokeWidth="1.2" fill="none" />
          <g transform="translate(0 16)">
            <path
              d="M 0 -6 L 3 -2 L 7 -1 L 4 2 L 5 6 L 0 4 L -5 6 L -4 2 L -7 -1 L -3 -2 Z"
              fill="url(#ornGold)"
            />
          </g>
        </g>
      </svg>

      <div
        style={{
          position: "absolute",
          top: 100,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ width: 80, height: 0.5, background: "#b88a2a" }} />
        <div style={{ background: "#0a2a5e", padding: "5px 11px", borderRadius: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="CDL"
            style={{ height: 22, display: "block", filter: "brightness(0) invert(1)" }}
          />
        </div>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: "0.5em",
            color: "#b88a2a",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {nomeOrgao} · {edicao} · {ano}
        </div>
        <div style={{ width: 80, height: 0.5, background: "#b88a2a" }} />
      </div>

      <div style={{ position: "absolute", top: 165, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 28,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "rgba(10,42,94,0.72)",
          }}
        >
          Certificado de
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 800,
            fontSize: 92,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            background: "linear-gradient(180deg, #d4a537 0%, #b88a2a 60%, #8a6516 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Honra ao Mérito
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 22,
            color: "#0a2a5e",
            letterSpacing: "0.05em",
          }}
        >
          Melhores do Ano · Edição {ano}
        </div>
      </div>

      <div style={{ position: "absolute", top: 405, left: 200, right: 200, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 17,
            lineHeight: 1.65,
            color: "rgba(10,42,94,0.78)",
          }}
        >
          A {nomeOrgao}, em sua tradicional homenagem ao comércio e à excelência da nossa cidade,
          outorga o presente título a
        </div>
      </div>

      <div style={{ position: "absolute", top: 510, left: 60, right: 60, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: 64,
            lineHeight: 1,
            letterSpacing: "-0.015em",
            color: "#0a2a5e",
            textShadow: "0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          {vencedor}
        </div>
        <div
          style={{
            marginTop: 22,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ width: 100, height: 1, background: "linear-gradient(90deg, transparent, #b88a2a)" }} />
          <div
            style={{
              width: 9,
              height: 9,
              transform: "rotate(45deg)",
              background: "linear-gradient(135deg, #f3dfa3, #8a6516)",
            }}
          />
          <div style={{ width: 220, height: 1, background: "#b88a2a" }} />
          <div
            style={{
              width: 9,
              height: 9,
              transform: "rotate(45deg)",
              background: "linear-gradient(135deg, #f3dfa3, #8a6516)",
            }}
          />
          <div style={{ width: 100, height: 1, background: "linear-gradient(-90deg, transparent, #b88a2a)" }} />
        </div>
      </div>

      <div style={{ position: "absolute", top: 645, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            letterSpacing: "0.55em",
            color: "#b88a2a",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          vencedor da categoria
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 36,
            color: "#0a2a5e",
          }}
        >
          {categoria}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 110,
          left: 110,
          right: 110,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "end",
          gap: 60,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 22,
              color: "#0a2a5e",
            }}
          >
            {cidade} · Sergipe
          </div>
          <div
            style={{
              marginTop: 10,
              paddingTop: 8,
              borderTop: "0.5px solid rgba(10,42,94,0.5)",
              fontFamily: FONT_MONO,
              fontSize: 9,
              letterSpacing: "0.4em",
              color: "rgba(10,42,94,0.6)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {ano}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              height: 50,
              marginBottom: 0,
              fontFamily: FONT_SIGN,
              fontSize: 46,
              color: "#0a2a5e",
              lineHeight: 1,
            }}
          >
            {signatario}
          </div>
          <div
            style={{
              paddingTop: 8,
              borderTop: "0.5px solid rgba(10,42,94,0.85)",
              fontFamily: FONT_DISPLAY,
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: 18,
              color: "#0a2a5e",
            }}
          >
            {signatario}
          </div>
          <div
            style={{
              marginTop: 4,
              fontFamily: FONT_MONO,
              fontSize: 10,
              letterSpacing: "0.4em",
              color: "#b88a2a",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            {cargo}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 80,
          right: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <svg width="80" height="60" style={{ marginBottom: -10 }}>
          <path d="M 20 0 L 20 50 L 5 60 L 25 50 L 25 0 Z" fill="#9c1a1a" opacity="0.85" />
          <path d="M 60 0 L 60 50 L 75 60 L 55 50 L 55 0 Z" fill="#7a1212" opacity="0.85" />
          <path d="M 22 0 L 58 0 L 58 5 L 22 5 Z" fill="#0a2a5e" />
        </svg>
        <svg width="100" height="100" viewBox="0 0 200 200">
          <defs>
            <radialGradient id="waxRed" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#d4524a" />
              <stop offset="50%" stopColor="#9c1a1a" />
              <stop offset="100%" stopColor="#5a0d0d" />
            </radialGradient>
          </defs>
          <path
            d="M 100 10 Q 130 8 150 25 Q 180 35 188 70 Q 195 105 175 135 Q 165 170 130 188 Q 95 195 70 178 Q 35 168 18 135 Q 8 100 25 70 Q 35 35 70 22 Q 85 12 100 10 Z"
            fill="url(#waxRed)"
            stroke="#5a0d0d"
            strokeWidth="1.5"
          />
          <circle cx="100" cy="100" r="62" fill="none" stroke="#f3dfa3" strokeWidth="0.6" opacity="0.5" />
          <text
            x="100"
            y="98"
            textAnchor="middle"
            fontFamily={FONT_DISPLAY}
            fontStyle="italic"
            fontWeight="800"
            fontSize="50"
            fill="#f3dfa3"
            opacity="0.9"
            letterSpacing="-2"
          >
            MdA
          </text>
          <text
            x="100"
            y="125"
            textAnchor="middle"
            fontFamily={FONT_MONO}
            fontSize="9"
            fill="#f3dfa3"
            letterSpacing="3"
            opacity="0.85"
          >
            {ano}
          </text>
        </svg>
      </div>

      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            fontFamily: FONT_MONO,
            fontSize: 9,
            letterSpacing: "0.4em",
            color: "rgba(10,42,94,0.5)",
            textTransform: "uppercase",
          }}
        >
          <span>{numero}</span>
          <span style={{ width: 4, height: 4, background: "#b88a2a", transform: "rotate(45deg)" }} />
          <span>{dominio || "cdlaju.com.br"}</span>
          <span style={{ width: 4, height: 4, background: "#b88a2a", transform: "rotate(45deg)" }} />
          <span>{edicao}</span>
        </div>
      </div>
    </div>
  );
}
