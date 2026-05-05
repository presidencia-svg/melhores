-- ==========================================================================
-- 034-tenants-signup-fields.sql
--
-- Campos adicionados no signup self-service (POST /api/cadastrar):
--   - admin_email: email do responsavel pelo tenant (recuperacao senha,
--     contato suporte, futuro envio de NF). Nao e' chave unica — duas CDLs
--     podem ter o mesmo financeiro/email institucional. Validacao de
--     formato no backend (zod).
--   - criada_via: 'manual' (CDL Aracaju seed) ou 'signup' (auto cadastro).
--     Util pra triagem ("quais foram criados pelo formulario publico").
--
-- Aditiva: nullable + default. CDL Aracaju nao precisa backfill imediato.
--
-- Rollback:
--   alter table tenants drop column if exists admin_email;
--   alter table tenants drop column if exists criada_via;
-- ==========================================================================

alter table tenants
  add column if not exists admin_email text,
  add column if not exists criada_via text
    check (criada_via in ('manual', 'signup') or criada_via is null);

create index if not exists idx_tenants_admin_email
  on tenants(admin_email) where admin_email is not null;
