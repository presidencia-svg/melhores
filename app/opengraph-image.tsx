import { ImageResponse } from "next/og";
import { getLogoWhiteDataUrl, loadEditorialFonts } from "@/lib/marketing/og-helpers";

export const alt = "Melhores do Ano CDL Aracaju 2025";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Renderiza sob demanda (não falha o build se Google Fonts der hiccup)
export const dynamic = "force-dynamic";

export default async function OgImage() {
  const logoSrc = await getLogoWhiteDataUrl();
  const fonts = await loadEditorialFonts();

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
          padding: "60px 80px",
          color: "#fbf8f1",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <div style={{ width: 28, height: 1, background: "#d4a537" }} />
          <div
            style={{
              color: "#d4a537",
              fontFamily: "Sora",
              fontWeight: 700,
              letterSpacing: 6,
              textTransform: "uppercase",
              fontSize: 20,
            }}
          >
            cdl aracaju · edição 2025
          </div>
          <div style={{ width: 28, height: 1, background: "#d4a537" }} />
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 80,
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
              fontSize: 132,
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 800,
              lineHeight: 0.85,
              letterSpacing: "-0.03em",
              color: "#e6bf5f",
            }}
          >
            de Aracaju
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 22,
              color: "rgba(251,248,241,0.85)",
            }}
          >
            <div style={{ width: 24, height: 1, background: "#d4a537" }} />
            <span
              style={{
                fontSize: 24,
                fontFamily: "Fraunces",
                fontStyle: "italic",
                fontWeight: 300,
              }}
            >
              são escolhidos por você
            </span>
            <div style={{ width: 24, height: 1, background: "#d4a537" }} />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              color: "rgba(251,248,241,0.85)",
              fontSize: 22,
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
              width={180}
              height={54}
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
