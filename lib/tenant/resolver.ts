import { headers } from "next/headers";
import { cache } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Tenant } from "./types";
import { TENANT_COLUNAS } from "./types";

// Slug do tenant default usado quando o host nao bate com nenhum dominio
// cadastrado. CDL Aracaju permanece como fallback enquanto a base de tenants
// ainda esta sendo populada (Fase 1B → 1C).
const TENANT_DEFAULT_SLUG = "aracaju";

// Cacheado dentro do request via React.cache. Cada request unico que chama
// getCurrentTenant() faz 1 query e reusa.
export const getTenantPorSlug = cache(
  async (slug: string): Promise<Tenant | null> => {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("tenants")
      .select(TENANT_COLUNAS)
      .eq("slug", slug)
      .eq("ativo", true)
      .maybeSingle();
    return (data as Tenant | null) ?? null;
  }
);

export const getTenantPorDominio = cache(
  async (dominio: string): Promise<Tenant | null> => {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("tenants")
      .select(TENANT_COLUNAS)
      .eq("dominio", dominio)
      .eq("ativo", true)
      .maybeSingle();
    return (data as Tenant | null) ?? null;
  }
);

export const getTenantPorId = cache(
  async (id: string): Promise<Tenant | null> => {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("tenants")
      .select(TENANT_COLUNAS)
      .eq("id", id)
      .maybeSingle();
    return (data as Tenant | null) ?? null;
  }
);

// Resolve o tenant do request atual via host header.
// 1. Tenta match exato em tenants.dominio
// 2. Tenta extrair slug do subdominio (ex: cdlsaopaulo.cdlaju.com.br → 'cdlsaopaulo')
// 3. Fallback: tenant default ('aracaju')
//
// Lanca se nem o default existir (banco fora do ar / tenant deletado).
export async function getCurrentTenant(): Promise<Tenant> {
  const h = await headers();
  const hostRaw = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const host = hostRaw.split(":")[0].toLowerCase();

  if (host) {
    const porDominio = await getTenantPorDominio(host);
    if (porDominio) return porDominio;

    // Tenta extrair slug do primeiro segmento (subdominio).
    const partes = host.split(".");
    if (partes.length >= 3) {
      const slug = partes[0];
      const porSlug = await getTenantPorSlug(slug);
      if (porSlug) return porSlug;
    }
  }

  const fallback = await getTenantPorSlug(TENANT_DEFAULT_SLUG);
  if (!fallback) {
    throw new Error(
      `tenant resolver: nem dominio "${host}" nem default "${TENANT_DEFAULT_SLUG}" foram encontrados em tenants`
    );
  }
  return fallback;
}

// Variante "seguro": retorna null em vez de lancar (pra middlewares que
// querem tratar host desconhecido com 404 ao inves de 500).
export async function tryGetCurrentTenant(): Promise<Tenant | null> {
  try {
    return await getCurrentTenant();
  } catch {
    return null;
  }
}

// Lista todos os tenants ativos. Usado por cron jobs que precisam iterar
// (ex: incentivo automatico de empate roda pra cada tenant).
export async function getAllActiveTenants(): Promise<Tenant[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("tenants")
    .select(TENANT_COLUNAS)
    .eq("ativo", true)
    .order("criado_em", { ascending: true });
  return (data as Tenant[] | null) ?? [];
}
