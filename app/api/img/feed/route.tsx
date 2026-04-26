import { ImageResponse } from "next/og";
import { getLogoWhiteDataUrl, loadEditorialFonts } from "@/lib/marketing/og-helpers";

export async function GET() {
  const logoSrc = await getLogoWhiteDataUrl();
  const fonts = await loadEditorialFonts();

  const img = new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #061d44 0%, #0a2a5e 55%, #143b7a 100%)",
          padding: 80,
          position: "relative",
          color: "#fbf8f1",
        }}
      >
        {/* Top kicker */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <div style={{ width: 36, height: 1, background: "#d4a537" }} />
          <div
            style={{
              color: "#d4a537",
              fontSize: 22,
              fontFamily: "Sora",
              fontWeight: 700,
              letterSpacing: 8,
              textTransform: "uppercase",
            }}
          >
            cdl aracaju · 2026
          </div>
          <div style={{ width: 36, height: 1, background: "#d4a537" }} />
        </div>

        {/* Hero */}
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
              fontSize: 168,
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
              marginTop: 28,
              color: "rgba(251,248,241,0.85)",
            }}
          >
            <div style={{ width: 28, height: 1, background: "#d4a537" }} />
            <span
              style={{
                fontSize: 28,
                fontFamily: "Fraunces",
                fontStyle: "italic",
                fontWeight: 300,
              }}
            >
              são escolhidos por você
            </span>
            <div style={{ width: 28, height: 1, background: "#d4a537" }} />
          </div>
        </div>

        {/* Bottom: logo + URL */}
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
    { width: 1080, height: 1080, fonts }
  );

  const headers = new Headers(img.headers);
  headers.set("Cache-Control", "public, max-age=86400");
  headers.set("Content-Disposition", 'inline; filename="melhores-feed.png"');
  return new Response(img.body, { status: img.status, headers });
}
