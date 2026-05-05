import { ImageResponse } from "next/og";
import {
  getLogoTenantDataUrl,
  loadEditorialFonts,
} from "@/lib/marketing/og-helpers";
import { tryGetCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";

// Banner horizontal 1920x600 — pra topo de site, email signature, capa LinkedIn
export async function GET() {
  const tenant = await tryGetCurrentTenant();
  const logoSrc = await getLogoTenantDataUrl(tenant?.logo_url ?? null, "white");
  const fonts = await loadEditorialFonts();

  let cidade = "do ano";
  let kicker = "edição";
  let dominio = "";
  let nomeTenant = "Logo";
  if (tenant) {
    nomeTenant = tenant.nome;
    cidade = tenant.nome.replace(/^CDL\s+/i, "");
    dominio = tenant.dominio ?? "";
    const status = await getEdicaoStatus(tenant.id);
    const ano =
      status.status !== "sem_edicao"
        ? status.edicao.ano
        : new Date().getFullYear();
    kicker = `${tenant.nome.toLowerCase()} · edição ${ano}`;
  }

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
            {kicker}
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
            {cidade ? `de ${cidade}` : "do ano"}
          </div>

          {dominio ? (
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
              Vote agora · {dominio}
            </div>
          ) : null}
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
            alt={nomeTenant}
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
