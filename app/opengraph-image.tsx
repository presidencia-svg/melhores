import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const alt = "Melhores do Ano CDL Aracaju 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const logoPath = path.join(process.cwd(), "public", "cdl-logo.png");
  const logoBuffer = await readFile(logoPath);
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

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
            background: "white",
            borderRadius: 20,
            padding: "16px 28px",
            marginBottom: 36,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="CDL Aracaju" width={220} height={80} style={{ objectFit: "contain" }} />
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
      </div>
    ),
    { ...size }
  );
}
