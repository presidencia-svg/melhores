-- ==========================================================================
-- 031-tenants-table.sql
--
-- Multi-tenant: cria tabela `tenants` (cada CDL/instituicao = um tenant).
-- CDL Aracaju vira tenant #1 (slug 'aracaju').
--
-- Aditiva e independente: nao toca em nenhum dado existente. As proximas
-- migrations (032, 033) ligam edicao e app_config nesse tenant.
--
-- Convencao: token Meta WhatsApp + credencial SPC + token Z-API ficam em env
-- vars (escopo CDL Aracaju, valido pra todos os tenants conforme decisao do
-- usuario + advogado). Cada tenant traz o PROPRIO phone_number_id Meta e os
-- proprios tokens Instagram. Templates Meta podem variar por tenant.
--
-- Rollback:
--   drop table if exists tenants cascade;
-- ==========================================================================

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),

  -- Identidade
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  nome text not null,
  cnpj text,
  dominio text,
  ativo boolean not null default true,

  -- Branding (preenchido pelo cliente no onboarding)
  logo_url text,
  cor_primaria text,
  cor_secundaria text,

  -- Meta WhatsApp Cloud API (token global no env, phone_number_id por tenant)
  meta_phone_number_id text,
  meta_template_otp text,
  meta_template_incentivo text,
  meta_template_incentivo_empate text,
  meta_template_parcial text,
  meta_template_lang text default 'pt_BR',

  -- Z-API (fallback, opcional por tenant)
  zapi_instance_id text,
  zapi_token text,
  zapi_client_token text,

  -- Instagram (Meta Graph API, tokens proprios por tenant)
  instagram_page_access_token text,
  instagram_business_account_id text,
  instagram_facebook_page_id text,
  instagram_username text,

  -- Admin auth (cada tenant tem a propria senha; super-admin global tem outro fluxo)
  admin_password_hash text,
  admin_totp_secret text,

  -- Trial / billing (preenchido na Fase 4 — pagamento)
  plano text check (plano in ('starter', 'pro', 'business') or plano is null),
  trial_ate timestamptz,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_tenants_dominio
  on tenants(dominio) where dominio is not null;
create index if not exists idx_tenants_ativo
  on tenants(ativo) where ativo = true;

-- Trigger pra atualizar atualizado_em.
create or replace function tg_tenants_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists trg_tenants_atualizado_em on tenants;
create trigger trg_tenants_atualizado_em
  before update on tenants
  for each row execute function tg_tenants_atualizado_em();

-- ==========================================================================
-- Seed: tenant #1 = CDL Aracaju.
-- Templates Meta atuais (lidos das envvars META_TEMPLATE_*).
-- Credenciais ficam em env (compartilhadas) — colunas ficam null no banco.
-- ==========================================================================
insert into tenants (slug, nome, dominio, ativo, meta_template_otp,
                    meta_template_incentivo, meta_template_incentivo_empate,
                    meta_template_parcial, meta_template_lang, plano)
values (
  'aracaju',
  'CDL Aracaju',
  'votar.cdlaju.com.br',
  true,
  'codigo_verificacao_2025',
  'incentivo_voto_2025',
  'incentivo_empate_2025',
  'parcial_voto_2025',
  'pt_BR',
  'business'
)
on conflict (slug) do nothing;
