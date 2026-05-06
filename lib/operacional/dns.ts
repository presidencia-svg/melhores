// Provisionamento automatico de dominio pra novo tenant.
//
// Fluxo (C — usando melhoresdoano.app em Cloudflare + Vercel):
//   1. Cloudflare: cria CNAME `{slug}.melhoresdoano.app` apontando pra
//      cname.vercel-dns.com (target padrao da Vercel pra dominios custom)
//   2. Vercel: adiciona o dominio no projeto pra Vercel emitir SSL e
//      rotear o request pro nosso app
//
// Tudo gracioso: se as env vars nao tiverem setadas, retorna { skipped: true }
// e nao quebra o signup. O admin pode adicionar DNS manualmente depois.
//
// ENV vars necessarias:
//   CLOUDFLARE_API_TOKEN  — token com permissao "Zone:DNS:Edit" no zone alvo
//   CLOUDFLARE_ZONE_ID    — zone id de melhoresdoano.app
//   VERCEL_API_TOKEN      — personal access token Vercel
//   VERCEL_PROJECT_ID     — id do projeto Vercel (acha em Settings → General)
//   VERCEL_TEAM_ID        — opcional, so se o projeto estiver em team

import axios, { AxiosError } from "axios";

export type DnsProvisionResult =
  | { ok: true; cloudflare: { recordId: string }; vercel: { ok: true } }
  | { ok: false; etapa: "cloudflare" | "vercel"; detalhe: string }
  | { skipped: true; motivo: string };

const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4";
const VERCEL_API = "https://api.vercel.com";
const VERCEL_TARGET_CNAME = "cname.vercel-dns.com";

function getEnv() {
  return {
    cfToken: process.env.CLOUDFLARE_API_TOKEN ?? "",
    cfZoneId: process.env.CLOUDFLARE_ZONE_ID ?? "",
    vercelToken: process.env.VERCEL_API_TOKEN ?? "",
    vercelProjectId: process.env.VERCEL_PROJECT_ID ?? "",
    vercelTeamId: process.env.VERCEL_TEAM_ID ?? "",
  };
}

export function dnsConfigurado(): boolean {
  const e = getEnv();
  return Boolean(e.cfToken && e.cfZoneId && e.vercelToken && e.vercelProjectId);
}

// Provisiona um dominio novo em ambas as plataformas.
// `dominio` deve ser FQDN ex: "cdlsaopaulo.melhoresdoano.app".
export async function provisionarDominio(
  dominio: string
): Promise<DnsProvisionResult> {
  if (!dnsConfigurado()) {
    return {
      skipped: true,
      motivo: "ENV vars de DNS nao configuradas. Pule por agora.",
    };
  }

  const env = getEnv();

  // 1. Cloudflare DNS — cria CNAME proxied=false (Vercel cuida do SSL).
  let cloudflareRecordId: string;
  try {
    const { data } = await axios.post(
      `${CLOUDFLARE_API}/zones/${env.cfZoneId}/dns_records`,
      {
        type: "CNAME",
        name: dominio,
        content: VERCEL_TARGET_CNAME,
        proxied: false,
        ttl: 1, // auto
        comment: "auto-provisionado pelo signup",
      },
      {
        headers: {
          Authorization: `Bearer ${env.cfToken}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );
    if (!data.success) {
      const erros = (data.errors ?? [])
        .map((e: { message: string }) => e.message)
        .join("; ");
      return { ok: false, etapa: "cloudflare", detalhe: erros || "falha sem detalhe" };
    }
    cloudflareRecordId = data.result.id;
  } catch (err) {
    const detalhe = extrairErro(err);
    // 81053 = "Record already exists" — tratamos como sucesso parcial e
    // tentamos descobrir o id do registro existente pra retornar.
    if (detalhe.includes("already exists") || detalhe.includes("81053")) {
      const existente = await acharRecordCloudflare(dominio, env);
      if (existente) {
        cloudflareRecordId = existente;
      } else {
        return { ok: false, etapa: "cloudflare", detalhe };
      }
    } else {
      return { ok: false, etapa: "cloudflare", detalhe };
    }
  }

  // 2. Vercel — adiciona dominio ao projeto.
  try {
    const url = new URL(
      `${VERCEL_API}/v10/projects/${env.vercelProjectId}/domains`
    );
    if (env.vercelTeamId) url.searchParams.set("teamId", env.vercelTeamId);

    await axios.post(
      url.toString(),
      { name: dominio },
      {
        headers: {
          Authorization: `Bearer ${env.vercelToken}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );
  } catch (err) {
    const detalhe = extrairErro(err);
    // domain_already_in_use no mesmo projeto = ja foi adicionado, OK.
    // Em outro projeto = problema, retorna erro.
    if (
      detalhe.includes("domain_already_in_use") ||
      detalhe.includes("already_assigned")
    ) {
      // OK — ja existe
    } else {
      return { ok: false, etapa: "vercel", detalhe };
    }
  }

  return {
    ok: true,
    cloudflare: { recordId: cloudflareRecordId },
    vercel: { ok: true },
  };
}

// Helper: GET no Cloudflare pra achar id de um CNAME ja existente.
async function acharRecordCloudflare(
  dominio: string,
  env: ReturnType<typeof getEnv>
): Promise<string | null> {
  try {
    const { data } = await axios.get(
      `${CLOUDFLARE_API}/zones/${env.cfZoneId}/dns_records`,
      {
        params: { type: "CNAME", name: dominio },
        headers: { Authorization: `Bearer ${env.cfToken}` },
        timeout: 10000,
      }
    );
    return data.result?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

function extrairErro(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{
      errors?: { message?: string; code?: number }[];
      error?: { message?: string; code?: string };
    }>;
    const data = ax.response?.data;
    if (data?.errors?.length) {
      return data.errors
        .map((e) => `[${e.code ?? "?"}] ${e.message ?? "?"}`)
        .join("; ");
    }
    if (data?.error?.message) return data.error.message;
    return ax.message;
  }
  return err instanceof Error ? err.message : "erro desconhecido";
}
