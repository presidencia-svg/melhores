import { ImageResponse } from "next/og";
import { getLogoWhiteDataUrl, loadEditorialFonts } from "@/lib/marketing/og-helpers";

// Slide do telão na cerimônia (1920x1080) — anúncio do vencedor por categoria
export async function GET() {
  const logoSrc = await getLogoWhiteDataUrl();
  const fonts = await loadEditorialFonts();

  const img = new ImageResponse(
    (
      <div
        style={{
          width: 1920,
          height: 1080,
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #061d44 0%, #0a2a5e 55%, #143b7a 100%)",
          color: "#fbf8f1",
          padding: "80px 100px",
          textAlign: "center",
        }}
      >
        {/* Top — kicker */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            color: "#d4a537",
            fontFamily: "Sora",
            fontWeight: 700,
            letterSpacing: 10,
            textTransform: "uppercase",
            fontSize: 22,
          }}
        >
          <div style={{ width: 36, height: 1, background: "#d4a537" }} />
          cerimônia · edição 2026
          <div style={{ width: 36, height: 1, background: "#d4a537" }} />
        </div>

        {/* Center */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontFamily: "Sora",
              fontWeight: 500,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "rgba(251,248,241,0.7)",
            }}
          >
            categoria
          </div>
          <div
            style={{
              fontSize: 72,
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 300,
              lineHeight: 0.95,
              marginBottom: 24,
            }}
          >
            Melhor [Subcategoria]
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              color: "#d4a537",
              fontFamily: "Sora",
              fontWeight: 700,
              letterSpacing: 8,
              textTransform: "uppercase",
              fontSize: 24,
              marginTop: 30,
            }}
          >
            <div style={{ width: 36, height: 1, background: "#d4a537" }} />
            vencedor
            <div style={{ width: 36, height: 1, background: "#d4a537" }} />
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
              marginTop: 14,
            }}
          >
            [Nome]
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              color: "rgba(251,248,241,0.5)",
              fontFamily: "Sora",
              fontWeight: 500,
              fontSize: 18,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            melhores do ano · cdl aracaju
          </div>
          <div style={{ display: "flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="CDL Aracaju"
              width={200}
              height={60}
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      </div>
    ),
    { width: 1920, height: 1080, fonts }
  );

  const headers = new Headers(img.headers);
  headers.set("Cache-Control", "public, max-age=86400");
  headers.set("Content-Disposition", 'inline; filename="cerimonia-telao.png"');
  return new Response(img.body, { status: img.status, headers });
}
