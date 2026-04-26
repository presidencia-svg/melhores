import { ImageResponse } from "next/og";
import { getLogoWhiteDataUrl, loadEditorialFonts } from "@/lib/marketing/og-helpers";

// Banner horizontal 1920x600 — pra topo de site, email signature, capa LinkedIn
export async function GET() {
  const logoSrc = await getLogoWhiteDataUrl();
  const fonts = await loadEditorialFonts();

  const img = new ImageResponse(
    (
      <div
        style={{
          width: 1920,
          height: 600,
          display: "flex",
          background:
            "linear-gradient(135deg, #061d44 0%, #0a2a5e 55%, #143b7a 100%)",
          color: "#fbf8f1",
          padding: "60px 100px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "#d4a537",
              fontFamily: "Sora",
              fontWeight: 700,
              letterSpacing: 6,
              textTransform: "uppercase",
              fontSize: 20,
            }}
          >
            <div style={{ width: 28, height: 1, background: "#d4a537" }} />
            cdl aracaju · edição 2026
          </div>

          <div
            style={{
              fontSize: 76,
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 300,
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              marginTop: 12,
            }}
          >
            Os melhores
          </div>
          <div
            style={{
              fontSize: 120,
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
              color: "rgba(251,248,241,0.7)",
              fontFamily: "Sora",
              fontWeight: 500,
              fontSize: 22,
              letterSpacing: 1,
              marginTop: 18,
            }}
          >
            Vote agora · votar.cdlaju.com.br
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 12,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="CDL Aracaju"
            width={280}
            height={84}
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>
    ),
    { width: 1920, height: 600, fonts }
  );

  const headers = new Headers(img.headers);
  headers.set("Cache-Control", "public, max-age=86400");
  headers.set("Content-Disposition", 'inline; filename="banner-web.png"');
  return new Response(img.body, { status: img.status, headers });
}
