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
          <svg width="120" height="120" viewBox="0 0 48 48" fill="#FFD700">
            <path d="M14 8 L14 22 C14 28 18 30 24 30 C30 30 34 28 34 22 L34 8 Z" />
            <path d="M12 10 C7 10 6 13 6 16 C6 19 8 21 13 21 L13 17 C10 17 10 16 10 15 C10 14 11 13 13 13 Z" />
            <path d="M36 10 C41 10 42 13 42 16 C42 19 40 21 35 21 L35 17 C38 17 38 16 38 15 C38 14 37 13 35 13 Z" />
            <rect x="22" y="29" width="4" height="6" />
            <rect x="14" y="35" width="20" height="5" rx="1" />
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
