-- ==========================================================================
-- 057-revoke-mat-view-riscado.sql
--
-- Bug: a materialized view v_resultados_riscado vazava 9283 linhas pra
-- anon (qualquer um com anon key publica do Supabase). Conteudo:
--
--   - candidato_id, candidato_nome, subcategoria_nome
--   - total_votos, score_risco (0-100 — detecta padroes de fraude)
--   - top1/top2 de cada subcategoria
--
-- Como mat views nao suportam security_invoker (so views regulares),
-- a unica defesa e' o GRANT/REVOKE nivel-tabela. Migration 049 cobriu
-- as views regulares (security_invoker=true) mas esqueceu desta mat
-- view porque ela e' criada na migration 023 separadamente.
--
-- Impacto: concorrente podia ler score_risco antes da divulgacao,
-- ter inteligencia sobre quais candidatos estavam sob suspeita de
-- fraude (insider info), e ver ranking antes do encerramento.
--
-- Fix (ja aplicado em prod via execute_sql): REVOKE SELECT de
-- public/anon/authenticated, GRANT SELECT pro service_role apenas.
-- App usa service_role via createSupabaseAdminClient → zero quebra.
-- ==========================================================================

revoke select on table v_resultados_riscado from public, anon, authenticated;
grant select on table v_resultados_riscado to service_role;
