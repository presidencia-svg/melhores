-- ==========================================================================
-- Views agregadas para o /admin (dashboard)
--
-- Razão: PostgREST trunca SELECT em 1000 linhas por padrão. Com 10k+ votos
-- e 2k+ votantes, agregar no app retorna número errado. Aqui o Postgres
-- faz a soma inteira e devolve poucas linhas pro app.
--
-- Rodar este arquivo no SQL Editor do Supabase em produção depois do deploy.
-- ==========================================================================

-- Votos agregados por dia (fuso America/Sao_Paulo) nos ultimos 30 dias.
-- Retorna ate ~30 linhas — sem risco de truncamento.
create or replace view v_votos_por_dia as
select
  (criado_em at time zone 'America/Sao_Paulo')::date as dia,
  count(*) as total
from votos
where criado_em >= (now() - interval '30 days')
group by 1
order by 1;
