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
          height: 1920,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          background:
            "linear-gradient(180deg, #061d44 0%, #0a2a5e 50%, #143b7a 100%)",
          padding: "120px 80px",
          color: "#fbf8f1",
          textAlign: "center",
        }}
      >
        {/* Top — kicker + logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              color: "#d4a537",
              fontFamily: "Sora",
              fontWeight: 700,
              letterSpacing: 8,
              textTransform: "uppercase",
              fontSize: 24,
            }}
          >
            <div style={{ width: 36, height: 1, background: "#d4a537" }} />
            edição 2025
            <div style={{ width: 36, height: 1, background: "#d4a537" }} />
          </div>
        </div>

        {/* Middle — Hero */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 110,
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
              fontSize: 192,
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
              gap: 18,
              marginTop: 36,
              color: "rgba(251,248,241,0.85)",
            }}
          >
            <div style={{ width: 36, height: 1, background: "#d4a537" }} />
            <span
              style={{
                fontSize: 36,
                fontFamily: "Fraunces",
                fontStyle: "italic",
                fontWeight: 300,
              }}
            >
              são escolhidos por você
            </span>
            <div style={{ width: 36, height: 1, background: "#d4a537" }} />
          </div>
        </div>

        {/* Bottom — CTA + logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
          }}
        >
          <div
            style={{
              color: "rgba(251,248,241,0.7)",
              fontFamily: "Sora",
              fontWeight: 500,
              fontSize: 28,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            acesse agora
          </div>
          <div
            style={{
              display: "flex",
              background: "#0f8a3f",
              color: "#fbf8f1",
              padding: "30px 50px",
              borderRadius: 4,
              fontFamily: "Sora",
              fontWeight: 700,
              fontSize: 44,
              letterSpacing: 1,
            }}
          >
            votar.cdlaju.com.br
          </div>
          <div style={{ display: "flex", marginTop: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="CDL Aracaju"
              width={300}
              height={90}
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts }
  );

  const headers = new Headers(img.headers);
  headers.set("Cache-Control", "public, max-age=86400");
  headers.set("Content-Disposition", 'inline; filename="melhores-story.png"');
  return new Response(img.body, { status: img.status, headers });
}
