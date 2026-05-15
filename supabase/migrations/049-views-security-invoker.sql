-- ==========================================================================
-- 049-views-security-invoker.sql
--
-- Resolve os 15 avisos "Security Definer View" do Supabase Advisor.
--
-- Por padrao, views no Postgres rodam com privilegios do OWNER (efeito
-- SECURITY DEFINER): se a view consulta uma tabela com RLS, ela bypassa
-- a politica do usuario que chamou. Postgres 15+ aceita
-- `security_invoker = true` pra inverter: a view passa a rodar com os
-- privilegios do CALLER, respeitando RLS dele.
--
-- No app, todo acesso a essas views vem do server com service_role
-- (ignora RLS), entao a mudanca nao quebra nada — so calar o Advisor
-- e adotar o default mais seguro pra futuro.
--
-- Itera por todas as views do schema public dinamicamente pra pegar
-- inclusive eventuais resíduos (ex: v_podium_riscado de migrations
-- antigas) sem precisar lembrar dos nomes.
-- ==========================================================================

do $$
declare
  v record;
begin
  for v in
    select schemaname, viewname from pg_views where schemaname = 'public'
  loop
    execute format(
      'alter view %I.%I set (security_invoker = true)',
      v.schemaname, v.viewname
    );
  end loop;
end $$;
