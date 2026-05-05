import { ImageResponse } from "next/og";
import {
  getLogoTenantDataUrl,
  loadEditorialFonts,
} from "@/lib/marketing/og-helpers";
import { tryGetCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";

export async function GET() {
  const tenant = await tryGetCurrentTenant();
  const logoSrc = await getLogoTenantDataUrl(tenant?.logo_url ?? null, "white");
  const fonts = await loadEditorialFonts();

  const nomeTenant = tenant?.nome ?? "CDL";
  let ano: number = new Date().getFullYear();
  if (tenant) {
    const status = await getEdicaoStatus(tenant.id);
    if (status.status !== "sem_edicao") ano = status.edicao.ano;
  }

  const img = new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1350,
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(180deg, #061d44 0%, #0a2a5e 50%, #143b7a 100%)",
          color: "#fbf8f1",
          padding: "100px 80px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            color: "#d4a537",
            fontFamily: "Sora",
            fontWeight: 700,
            letterSpacing: 8,
            textTransform: "uppercase",
            fontSize: 22,
          }}
        >
          <div style={{ width: 30, height: 1, background: "#d4a537" }} />
          convite digital
          <div style={{ width: 30, height: 1, background: "#d4a537" }} />
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 42,
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 300,
              color: "rgba(251,248,241,0.85)",
              marginBottom: 10,
            }}
          >
            A {nomeTenant} convida
          </div>
          <div
            style={{
              fontSize: 92,
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 300,
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
          >
            para a cerimônia
          </div>
          <div
            style={{
              fontSize: 60,
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 300,
              lineHeight: 0.95,
            }}
          >
            de premiação dos
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
              marginTop: 4,
            }}
          >
            Melhores do Ano
          </div>
          <div
            style={{
              fontSize: 60,
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 300,
              marginTop: 8,
            }}
          >
            edição {ano}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: 60,
              padding: "30px 50px",
              border: "1px solid rgba(212,165,55,0.4)",
              borderRadius: 4,
              gap: 8,
            }}
          >
            <div
              style={{
                color: "#d4a537",
                fontFamily: "Sora",
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: 6,
                textTransform: "uppercase",
              }}
            >
              data · local
            </div>
            <div
              style={{
                fontFamily: "Fraunces",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 32,
                color: "rgba(251,248,241,0.85)",
              }}
            >
              definir data e local
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={nomeTenant}
            width={240}
            height={72}
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>
    ),
    { width: 1080, height: 1350, fonts }
  );

  const headers = new Headers(img.headers);
  headers.set("Cache-Control", "public, max-age=86400");
  headers.set("Content-Disposition", 'inline; filename="convite-cerimonia.png"');
  return new Response(img.body, { status: img.status, headers });
}
