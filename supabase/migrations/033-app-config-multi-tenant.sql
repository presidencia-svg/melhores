-- ==========================================================================
-- 033-app-config-multi-tenant.sql
--
-- Transforma app_config em chave composta (tenant_id, chave). Cada tenant
-- tem o proprio set de toggles (auto_incentivo_empate, spc_consulta,
-- whatsapp_validacao, etc) sem interferir nos outros.
--
-- Sequencia:
--   1. add coluna tenant_id nullable
--   2. backfill com tenant 'aracaju' (todas as configs existentes)
--   3. NOT NULL
--   4. drop pkey (chave), add pkey (tenant_id, chave)
--
-- Importante: depois desta migration, queries em app_config que filtram
-- apenas por `chave` continuam retornando 1 linha enquanto so existir o
-- tenant CDL Aracaju. Quando entrar o segundo tenant, queries SEM
-- tenant_id ficam ambiguas — isso e' resolvido na Fase 1B (refactor das
-- chamadas em lib/whatsapp/mode.ts, lib/spc/mode.ts, etc).
--
-- Rollback:
--   alter table app_config drop constraint app_config_pkey;
--   alter table app_config add primary key (chave);
--   alter table app_config drop column if exists tenant_id;
--   drop index if exists idx_app_config_tenant;
-- ==========================================================================

-- 1. Coluna nullable
alter table app_config
  add column if not exists tenant_id uuid references tenants(id) on delete cascade;

-- 2. Backfill
update app_config
  set tenant_id = (select id from tenants where slug = 'aracaju')
  where tenant_id is null;

-- 3. NOT NULL
alter table app_config alter column tenant_id set not null;

-- 4. Pkey composta
alter table app_config drop constraint if exists app_config_pkey;
alter table app_config add primary key (tenant_id, chave);

create index if not exists idx_app_config_tenant on app_config(tenant_id);
