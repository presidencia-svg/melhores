-- ==========================================================================
-- 052-tenant-assinatura.sql
--
-- Adiciona campos assinatura_nome e assinatura_cargo na tabela tenants.
-- Usados nas placas de homenagem (/admin/placas) e podem ser usados em
-- certificados/convites futuros. Cada tenant configura em /admin/marca
-- ("Elison Bomfim" / "Presidente CDL Aracaju" pro Aracaju, outros pra
-- outras CDLs).
--
-- Idempotente. Roda no SQL Editor do Supabase.
-- ==========================================================================

alter table tenants
  add column if not exists assinatura_nome text,
  add column if not exists assinatura_cargo text;
