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
            "linear-gradient(135deg, #0a6f30 0%, #0f8a3f 50%, #14a851 100%)",
          padding: 80,
          color: "#fbf8f1",
          position: "relative",
        }}
      >
        {/* Trophy ornament + kicker */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <svg width="100" height="110" viewBox="0 0 80 88" fill="none">
            <path d="M20 8h40v18a20 20 0 0 1-40 0V8z" stroke="#fbf8f1" strokeWidth="3" strokeLinejoin="round" />
            <path d="M20 12c-6 0-10 3-10 8s4 8 10 8" stroke="#fbf8f1" strokeWidth="3" strokeLinecap="round" />
            <path d="M60 12c6 0 10 3 10 8s-4 8-10 8" stroke="#fbf8f1" strokeWidth="3" strokeLinecap="round" />
            <path d="M32 46v8c0 3 2 6 8 6s8-3 8-6v-8" stroke="#fbf8f1" strokeWidth="3" strokeLinecap="round" />
            <rect x="24" y="60" width="32" height="6" rx="1" stroke="#fbf8f1" strokeWidth="3" />
            <rect x="20" y="66" width="40" height="6" rx="1.5" stroke="#fbf8f1" strokeWidth="3" />
            <path d="M32 24l5 4 8-8" stroke="#fbf8f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "rgba(251,248,241,0.85)",
              fontFamily: "Sora",
              fontWeight: 700,
              letterSpacing: 8,
              textTransform: "uppercase",
              fontSize: 22,
            }}
          >
            <div style={{ width: 30, height: 1, background: "#fbf8f1" }} />
            voto registrado
            <div style={{ width: 30, height: 1, background: "#fbf8f1" }} />
          </div>
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
              fontSize: 88,
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 300,
              lineHeight: 0.95,
            }}
          >
            Eu votei nos
          </div>
          <div
            style={{
              fontSize: 152,
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 800,
              lineHeight: 0.85,
              letterSpacing: "-0.03em",
            }}
          >
            Melhores
          </div>
          <div
            style={{
              fontSize: 44,
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 300,
              marginTop: 20,
              opacity: 0.95,
            }}
          >
            do Ano CDL Aracaju 2025
          </div>
        </div>

        {/* CTA + logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 22,
          }}
        >
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
                color: "rgba(251,248,241,0.85)",
                fontFamily: "Sora",
                fontWeight: 500,
                fontSize: 22,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              vote você também
            </div>
            <div
              style={{
                color: "#fbf8f1",
                fontFamily: "Sora",
                fontWeight: 700,
                fontSize: 36,
                letterSpacing: 1,
              }}
            >
              votar.cdlaju.com.br
            </div>
          </div>
          <div style={{ display: "flex", marginTop: 6 }}>
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
    { width: 1080, height: 1080, fonts }
  );

  const headers = new Headers(img.headers);
  headers.set("Cache-Control", "public, max-age=86400");
  headers.set("Content-Disposition", 'inline; filename="eu-votei.png"');
  return new Response(img.body, { status: img.status, headers });
}
