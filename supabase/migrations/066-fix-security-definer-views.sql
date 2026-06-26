-- ==========================================================================
-- 066-fix-security-definer-views.sql
--
-- Supabase advisor reportou 3 alertas CRITICOS de seguranca:
--   - public.v_votos_por_dia
--   - public.v_votos_por_hora_hoje
--   - public.v_resumo_hoje
-- todas com SECURITY DEFINER, o que bypassa RLS — qualquer consulta
-- via PostgREST com anon key veria dados que normalmente seriam
-- bloqueados.
--
-- Causa: a migration 065 recriou essas views com `create or replace
-- view` sem aplicar `security_invoker = true`. A flag (que tinha sido
-- aplicada na migration 049 pras views originais) se perdeu no replace.
--
-- Fix em 2 camadas:
--   1. security_invoker = true (view roda com permissoes do consumidor)
--   2. REVOKE de anon/authenticated + GRANT so' pro service_role
--      (defesa em profundidade — app admin usa service_role que bypassa)
-- ==========================================================================

alter view public.v_votos_por_dia       set (security_invoker = true);
alter view public.v_votos_por_hora_hoje set (security_invoker = true);
alter view public.v_resumo_hoje         set (security_invoker = true);

revoke select on table public.v_votos_por_dia       from anon, authenticated;
revoke select on table public.v_votos_por_hora_hoje from anon, authenticated;
revoke select on table public.v_resumo_hoje         from anon, authenticated;

grant select on table public.v_votos_por_dia       to service_role;
grant select on table public.v_votos_por_hora_hoje to service_role;
grant select on table public.v_resumo_hoje         to service_role;
