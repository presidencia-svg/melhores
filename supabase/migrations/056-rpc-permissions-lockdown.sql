-- ==========================================================================
-- 056-rpc-permissions-lockdown.sql
--
-- Bug critico de segurança: varias RPCs SECURITY DEFINER + algumas
-- SECURITY INVOKER de operacoes sensiveis estavam executaveis por anon
-- (e authenticated) via PostgREST. Como Supabase expoe automaticamente
-- todas as funcs do schema 'public' como endpoints REST, qualquer um
-- com a URL do Supabase + anon key publica podia:
--
--   - deletar_tenant_completo(uuid) — APAGAR um tenant inteiro com
--     votos, votantes, candidatos, edicoes. Catastrofico. UUID do
--     tenant vaza em URLs e nao e' "secreto".
--
--   - resgatar_cupom(text, uuid) — resgatar cupom de qualquer tenant.
--     Atacante com cupom valido + tenant_id ganha creditos pra qualquer
--     tenant. Fraude direta.
--
--   - debitar_credito(...) / creditar_credito(...) — mexer no saldo
--     direto se conseguir adivinhar tenant_id. Embora seja SECURITY
--     INVOKER (respeita RLS), as tabelas creditos_tenant nao tem RLS
--     ligado — entao funciona.
--
-- Fix: REVOKE EXECUTE FROM PUBLIC, anon e authenticated. Mantem so
-- service_role (que a app usa via createSupabaseAdminClient — nao
-- exposto pro browser). Todas as chamadas legitimas vem do server,
-- nao do client.
--
-- Idempotente: usa revoke se exists.
-- ==========================================================================

-- Critical SECURITY DEFINER — atacante pode bypassar RLS
revoke execute on function deletar_tenant_completo(uuid) from public, anon, authenticated;
revoke execute on function resgatar_cupom(text, uuid)    from public, anon, authenticated;
revoke execute on function refresh_resultados_riscado()  from public, anon, authenticated;

-- Critical SECURITY INVOKER — mexem em creditos do tenant
revoke execute on function debitar_credito(uuid, bigint, text, text, uuid, uuid)
  from public, anon, authenticated;
revoke execute on function creditar_credito(uuid, bigint, text, text, uuid)
  from public, anon, authenticated;

-- service_role mantem (chave nunca exposta no browser, so server-side)
grant execute on function deletar_tenant_completo(uuid)                          to service_role;
grant execute on function resgatar_cupom(text, uuid)                              to service_role;
grant execute on function refresh_resultados_riscado()                            to service_role;
grant execute on function debitar_credito(uuid, bigint, text, text, uuid, uuid)   to service_role;
grant execute on function creditar_credito(uuid, bigint, text, text, uuid)        to service_role;
