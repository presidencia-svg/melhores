import { ImageResponse } from "next/og";

export const alt = "Melhores do Ano CDL Aracaju 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #142D5F 0%, #1B3A7A 50%, #2D5BAE 100%)",
          padding: 80,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 28,
          }}
        >
          <svg width="100" height="100" viewBox="0 0 48 48" fill="#FFD700">
            <path d="M24 2l5.5 13.5L44 17l-11 9.5L36 41l-12-7.5L12 41l3-14.5L4 17l14.5-1.5L24 2z" />
          </svg>
        </div>

        <div
          style={{
            display: "flex",
            color: "#FFD700",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Edição 2026 · Aberta para votação
        </div>

        <div
          style={{
            display: "flex",
            color: "white",
            fontSize: 78,
            fontWeight: 800,
            lineHeight: 1.05,
            marginBottom: 16,
          }}
        >
          Os Melhores de Aracaju
        </div>

        <div
          style={{
            display: "flex",
            color: "#FFD700",
            fontSize: 78,
            fontWeight: 800,
            lineHeight: 1.05,
            marginBottom: 32,
          }}
        >
          são escolhidos por você.
        </div>

        <div
          style={{
            display: "flex",
            color: "rgba(255,255,255,0.85)",
            fontSize: 30,
            fontWeight: 500,
            marginTop: 16,
          }}
        >
          votar.cdlaju.com.br
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 36,
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "rgba(255,255,255,0.7)",
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          <div style={{ width: 16, height: 16, background: "#00A859", borderRadius: 4 }} />
          CDL ARACAJU · Câmara de Dirigentes Lojistas
        </div>
      </div>
    ),
    { ...size }
  );
}
