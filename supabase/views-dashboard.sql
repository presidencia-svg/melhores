-- ==========================================================================
-- Views/RPCs agregadas pro admin (dashboard + insights WhatsApp)
--
-- Razao: PostgREST trunca SELECT em 1000 linhas por padrao. Com 10k+ votos
-- e 2k+ votantes, agregar no app retorna numero errado. Aqui o Postgres
-- faz a soma inteira e devolve poucas linhas pro app.
--
-- Rodar este arquivo no SQL Editor do Supabase em producao depois do deploy.
-- ==========================================================================

-- Votos agregados por dia (fuso America/Sao_Paulo) nos ultimos 90 dias.
-- Retorna ate ~90 linhas — sem risco de truncamento.
create or replace view v_votos_por_dia as
select
  (criado_em at time zone 'America/Sao_Paulo')::date as dia,
  count(*) as total
from votos
where criado_em >= (now() - interval '90 days')
group by 1
order by 1;

-- Resumo de votos no periodo (total + votantes unicos).
-- count(distinct ...) nao da pra fazer pelo PostgREST direto, entao expoe
-- como funcao RPC. Chamar com: supabase.rpc('insights_votos_periodo', { dias: 7 }).
create or replace function insights_votos_periodo(dias int)
returns table (total bigint, votantes_unicos bigint)
language sql
stable
as $$
  select
    count(*)::bigint                       as total,
    count(distinct votante_id)::bigint     as votantes_unicos
  from votos
  where criado_em >= now() - (dias || ' days')::interval;
$$;

-- Resumo de OTPs no periodo (total + validados + tentativas medias).
-- Mesmo padrao — RPC pra contornar truncamento e calcular AVG no banco.
create or replace function insights_otp_periodo(dias int)
returns table (total bigint, validados bigint, tentativas_media numeric)
language sql
stable
as $$
  select
    count(*)::bigint                                                    as total,
    count(*) filter (where validado)::bigint                            as validados,
    coalesce(avg(tentativas), 0)::numeric(10,2)                         as tentativas_media
  from whatsapp_codigos
  where criado_em >= now() - (dias || ' days')::interval;
$$;

-- OTPs solicitados por dia (fuso BRT) nos ultimos 90 dias.
create or replace view v_otp_por_dia as
select
  (criado_em at time zone 'America/Sao_Paulo')::date as dia,
  count(*) as total
from whatsapp_codigos
where criado_em >= (now() - interval '90 days')
group by 1
order by 1;
