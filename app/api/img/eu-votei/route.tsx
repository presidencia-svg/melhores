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
          background: "linear-gradient(135deg, #00A859 0%, #007A40 50%, #004D29 100%)",
          padding: 80,
          textAlign: "center",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", fontSize: 200, marginBottom: 12 }}>🏆</div>

        <div
          style={{
            display: "flex",
            color: "white",
            fontSize: 70,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          Eu votei nos
        </div>
        <div
          style={{
            display: "flex",
            color: "#FFD700",
            fontSize: 120,
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          MELHORES
        </div>
        <div
          style={{
            display: "flex",
            color: "white",
            fontSize: 56,
            fontWeight: 700,
            marginBottom: 40,
          }}
        >
          do Ano CDL Aracaju 2026
        </div>

        <div
          style={{
            display: "flex",
            color: "rgba(255,255,255,0.85)",
            fontSize: 36,
            fontWeight: 500,
            marginBottom: 28,
          }}
        >
          Vote você também:
        </div>

        <div
          style={{
            display: "flex",
            background: "white",
            color: "#00A859",
            fontSize: 44,
            fontWeight: 800,
            padding: "22px 48px",
            borderRadius: 100,
            marginBottom: 60,
          }}
        >
          votar.cdlaju.com.br
        </div>

        <div
          style={{
            display: "flex",
            background: "white",
            borderRadius: 22,
            padding: "20px 36px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="CDL" width={420} height={126} style={{ objectFit: "contain" }} />
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  );

  const headers = new Headers(img.headers);
  headers.set("Cache-Control", "public, max-age=86400");
  headers.set("Content-Disposition", 'inline; filename="eu-votei.png"');
  return new Response(img.body, { status: img.status, headers });
}
