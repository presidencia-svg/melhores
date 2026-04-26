import { ImageResponse } from "next/og";
import { getLogoDataUrl } from "@/lib/marketing/og-helpers";

export async function GET() {
  const logoSrc = await getLogoDataUrl();

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
          background: "linear-gradient(180deg, #142D5F 0%, #1B3A7A 50%, #2D5BAE 100%)",
          padding: 100,
          textAlign: "center",
        }}
      >
        {/* Top — Logo */}
        <div
          style={{
            display: "flex",
            background: "white",
            borderRadius: 32,
            padding: "36px 56px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="CDL" width={680} height={204} style={{ objectFit: "contain" }} />
        </div>

        {/* Middle — Hero */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              color: "#FFD700",
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: 10,
              textTransform: "uppercase",
              marginBottom: 30,
            }}
          >
            🏆 Edição 2026
          </div>

          <div
            style={{
              display: "flex",
              color: "white",
              fontSize: 130,
              fontWeight: 900,
              lineHeight: 0.95,
              marginBottom: 16,
            }}
          >
            VOTE NOS
          </div>
          <div
            style={{
              display: "flex",
              color: "#FFD700",
              fontSize: 150,
              fontWeight: 900,
              lineHeight: 0.95,
              marginBottom: 30,
            }}
          >
            MELHORES
          </div>
          <div
            style={{
              display: "flex",
              color: "white",
              fontSize: 50,
              fontWeight: 600,
            }}
          >
            de Aracaju
          </div>
        </div>

        {/* Bottom — CTA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              color: "rgba(255,255,255,0.85)",
              fontSize: 36,
              fontWeight: 500,
              marginBottom: 22,
            }}
          >
            Acesse agora
          </div>
          <div
            style={{
              display: "flex",
              background: "#00A859",
              color: "white",
              fontSize: 52,
              fontWeight: 800,
              padding: "32px 56px",
              borderRadius: 120,
            }}
          >
            votar.cdlaju.com.br
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  );

  const headers = new Headers(img.headers);
  headers.set("Cache-Control", "public, max-age=86400");
  headers.set("Content-Disposition", 'inline; filename="melhores-story.png"');
  return new Response(img.body, { status: img.status, headers });
}
