import type { Tenant } from "./types";

// Branding agregado pra passar pra components (props serializaveis).
// Server components/pages chamam montarBranding(tenant, edicao) e passam pra
// client components, que usam nas captions/legends/posts sem precisar
// resolver tenant de novo.
export type TenantBranding = {
  nome: string;              // "CDL Aracaju"
  cidade: string;            // "Aracaju"
  dominio: string;           // "votar.cdlaju.com.br"
  instagramUsername: string; // "cdlaju"
  nomeCampanha: string;      // "Melhores do Ano CDL Aracaju 2025"
  ano: number;               // 2025
  hashtags: string;          // "#MelhoresDoAnoCDL #CDLAracaju #Aracaju"
  logoUrl: string | null;
};

type EdicaoMin = {
  ano: number;
  nome: string;
} | null;

export function montarBranding(
  tenant: Tenant,
  edicao: EdicaoMin
): TenantBranding {
  const cidade = tenant.nome.replace(/^CDL\s+/i, "").trim();
  const ano = edicao?.ano ?? new Date().getFullYear();
  const nomeCampanha =
    edicao?.nome ?? `Melhores do Ano ${tenant.nome} ${ano}`;
  const sigla = tenant.nome.replace(/\s+/g, "");
  const cidadeSemEspaco = cidade.replace(/\s+/g, "");
  const hashtags = `#MelhoresDoAno${cidadeSemEspaco} #${sigla}${
    cidadeSemEspaco ? ` #${cidadeSemEspaco}` : ""
  }`.trim();

  return {
    nome: tenant.nome,
    cidade,
    dominio: tenant.dominio ?? "",
    instagramUsername: tenant.instagram_username ?? "",
    nomeCampanha,
    ano,
    hashtags,
    logoUrl: tenant.logo_url,
  };
}
