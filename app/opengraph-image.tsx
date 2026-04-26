import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const alt = "Melhores do Ano CDL Aracaju 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadGoogleFont(
  family: string,
  weight: number,
  italic: boolean
): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:ital,wght@${italic ? 1 : 0},${weight}`;
  // User-Agent antigo (pre-WOFF2) força Google Fonts a retornar TTF
  const css = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:6.0) Gecko/20100101 Firefox/6.0",
    },
  }).then((r) => r.text());
  const match =
    css.match(/url\((.+?)\)\s*format\(['"]truetype['"]\)/) ??
    css.match(/url\((.+?)\)/);
  if (!match) throw new Error("font url not found");
  return fetch(match[1]).then((r) => r.arrayBuffer());
}

export default async function OgImage() {
  const logoPath = path.join(process.cwd(), "public", "cdl-logo-white.png");
  const logoBuffer = await readFile(logoPath);
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  const [fraunces300, fraunces800, sora500, sora700] = await Promise.all([
    loadGoogleFont("Fraunces", 300, true),
    loadGoogleFont("Fraunces", 800, true),
    loadGoogleFont("Sora", 500, false),
    loadGoogleFont("Sora", 700, false),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #061d44 0%, #0a2a5e 55%, #143b7a 100%)",
          padding: "70px 80px",
          position: "relative",
        }}
      >
        {/* Kicker top */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "#d4a537",
              fontSize: 20,
              fontFamily: "Sora",
              fontWeight: 700,
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            <div style={{ width: 28, height: 1, background: "#d4a537" }} />
            cdl aracaju · edição 2026
            <div style={{ width: 28, height: 1, background: "#d4a537" }} />
          </div>
        </div>

        {/* Hero */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "#fbf8f1",
              fontSize: 100,
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 300,
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
          >
            Os melhores
          </div>
          <div
            style={{
              color: "#e6bf5f",
              fontSize: 142,
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 800,
              lineHeight: 0.85,
              letterSpacing: "-0.03em",
              marginTop: 4,
            }}
          >
            de Aracaju
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginTop: 32,
              color: "rgba(251,248,241,0.85)",
            }}
          >
            <div style={{ width: 28, height: 1, background: "#d4a537" }} />
            <div
              style={{
                fontSize: 30,
                fontFamily: "Fraunces",
                fontStyle: "italic",
                fontWeight: 300,
              }}
            >
              são escolhidos por você
            </div>
            <div style={{ width: 28, height: 1, background: "#d4a537" }} />
          </div>
        </div>

        {/* Bottom row: URL + logo */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              color: "rgba(251,248,241,0.85)",
              fontSize: 24,
              fontFamily: "Sora",
              fontWeight: 500,
              letterSpacing: 1,
            }}
          >
            votar.cdlaju.com.br
          </div>
          <div style={{ display: "flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="CDL Aracaju"
              width={220}
              height={66}
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fraunces300, weight: 300, style: "italic" },
        { name: "Fraunces", data: fraunces800, weight: 800, style: "italic" },
        { name: "Sora", data: sora500, weight: 500, style: "normal" },
        { name: "Sora", data: sora700, weight: 700, style: "normal" },
      ],
    }
  );
}
