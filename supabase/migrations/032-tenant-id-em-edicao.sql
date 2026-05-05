-- ==========================================================================
-- 032-tenant-id-em-edicao.sql
--
-- Adiciona tenant_id em edicao + ajusta unique constraint pra ser
-- por-tenant (cada tenant pode ter sua propria edicao 2026).
--
-- Sequencia:
--   1. add column nullable
--   2. backfill com tenant 'aracaju'
--   3. set NOT NULL
--   4. drop unique(ano), add unique(tenant_id, ano)
--
-- Aditiva no sentido logico: dados existentes preservados, apenas ganham
-- referencia ao tenant. Producao continua funcionando porque so existe
-- 1 tenant ate Fase 1B introduzir resolucao por host.
--
-- Rollback:
--   alter table edicao drop constraint if exists edicao_tenant_ano_unique;
--   alter table edicao add constraint edicao_ano_key unique (ano);
--   alter table edicao drop column if exists tenant_id;
--   drop index if exists idx_edicao_tenant;
-- ==========================================================================

-- 1. Coluna nullable
alter table edicao
  add column if not exists tenant_id uuid references tenants(id) on delete restrict;

-- 2. Backfill: toda edicao existente pertence ao CDL Aracaju
update edicao
  set tenant_id = (select id from tenants where slug = 'aracaju')
  where tenant_id is null;

-- 3. NOT NULL
alter table edicao alter column tenant_id set not null;

-- 4. Substituir unique(ano) por unique(tenant_id, ano)
--    (em PG o nome auto-gerado pra UNIQUE e' <tabela>_<coluna>_key)
alter table edicao drop constraint if exists edicao_ano_key;
alter table edicao
  add constraint edicao_tenant_ano_unique unique (tenant_id, ano);

create index if not exists idx_edicao_tenant on edicao(tenant_id);
