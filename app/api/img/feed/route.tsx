import { ImageResponse } from "next/og";
import { getLogoDataUrl } from "@/lib/marketing/og-helpers";

export async function GET() {
  const logoSrc = await getLogoDataUrl();

  const img = new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #142D5F 0%, #1B3A7A 50%, #2D5BAE 100%)",
          padding: 80,
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            background: "white",
            borderRadius: 28,
            padding: "30px 50px",
            marginBottom: 60,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="CDL" width={580} height={174} style={{ objectFit: "contain" }} />
        </div>

        <div
          style={{
            display: "flex",
            color: "#FFD700",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: 8,
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          Edição 2026
        </div>

        <div
          style={{
            display: "flex",
            color: "white",
            fontSize: 92,
            fontWeight: 800,
            lineHeight: 1.05,
            marginBottom: 12,
          }}
        >
          Os Melhores
        </div>
        <div
          style={{
            display: "flex",
            color: "white",
            fontSize: 92,
            fontWeight: 800,
            lineHeight: 1.05,
            marginBottom: 12,
          }}
        >
          de Aracaju são
        </div>
        <div
          style={{
            display: "flex",
            color: "#FFD700",
            fontSize: 92,
            fontWeight: 800,
            lineHeight: 1.05,
            marginBottom: 56,
          }}
        >
          escolhidos por você.
        </div>

        <div
          style={{
            display: "flex",
            background: "#00A859",
            color: "white",
            fontSize: 38,
            fontWeight: 800,
            padding: "20px 44px",
            borderRadius: 100,
          }}
        >
          🏆 votar.cdlaju.com.br
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  );

  const headers = new Headers(img.headers);
  headers.set("Cache-Control", "public, max-age=86400");
  headers.set("Content-Disposition", 'inline; filename="melhores-feed.png"');
  return new Response(img.body, { status: img.status, headers });
}
