-- ==========================================================================
-- 054-cerimonia-slides-categoria.sql
--
-- Adiciona categoria + subcategoria nos slides da cerimonia LED. Permite
-- agrupar/relacionar slide com o vencedor da subcategoria oficial.
-- Auto-preenchido no /importar quando o nome da empresa bate com o top1
-- do podio (case-insensitive sem acento). Manualmente editavel pela UI.
--
-- Idempotente. Roda no SQL Editor do Supabase.
-- ==========================================================================

alter table cerimonia_slides
  add column if not exists categoria text,
  add column if not exists subcategoria text;
