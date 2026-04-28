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

-- Top 50 candidatos (sort no banco, evita truncamento da v_resultados).
create or replace view v_top_candidatos as
select *
from v_resultados
order by total_votos desc
limit 50;

-- Soma de votos por categoria (poucas linhas — 1 por categoria).
create or replace view v_resultados_por_categoria as
select
  categoria_id,
  categoria_nome,
  sum(total_votos)::bigint as total_votos
from v_resultados
group by categoria_id, categoria_nome
order by total_votos desc;

-- Fingerprints compartilhados (>= 2 votantes) — small list, sem trunc.
create or replace view v_fingerprints_compartilhados as
select device_fingerprint, count(*)::int as total
from votantes
where device_fingerprint is not null
group by device_fingerprint
having count(*) > 1;

-- Listagem paginada de votantes com count de votos. Trunc seguro pq retorna
-- exatamente p_limit linhas (geralmente 50 da pagina admin).
create or replace function votantes_listagem(p_offset int, p_limit int)
returns table (
  id uuid,
  cpf text,
  nome text,
  selfie_url text,
  ip text,
  user_agent text,
  device_fingerprint text,
  whatsapp text,
  whatsapp_validado boolean,
  criado_em timestamptz,
  votos_count bigint,
  total_count bigint
)
language sql
stable
as $$
  select
    v.id, v.cpf, v.nome, v.selfie_url, v.ip, v.user_agent,
    v.device_fingerprint, v.whatsapp, v.whatsapp_validado, v.criado_em,
    coalesce((select count(*) from votos where votante_id = v.id), 0)::bigint as votos_count,
    (select count(*) from votantes)::bigint as total_count
  from votantes v
  order by v.criado_em desc
  offset p_offset
  limit p_limit;
$$;

-- Resumo do dia em curso (BRT). Retorna 1 linha com 4 contagens.
create or replace view v_resumo_hoje as
with hoje as (
  select (now() at time zone 'America/Sao_Paulo')::date as d
)
select
  (select count(*) from votos, hoje
    where (criado_em at time zone 'America/Sao_Paulo')::date = hoje.d)::int as votos,
  (select count(*) from votantes, hoje
    where (criado_em at time zone 'America/Sao_Paulo')::date = hoje.d)::int as votantes,
  (select count(*) from whatsapp_codigos, hoje
    where (criado_em at time zone 'America/Sao_Paulo')::date = hoje.d)::int as otps,
  (select count(*) from votantes, hoje
    where parcial_enviada_em is not null
      and (parcial_enviada_em at time zone 'America/Sao_Paulo')::date = hoje.d)::int as parciais;

-- Votos por hora do dia em curso (BRT). Ate 24 linhas (0-23h).
create or replace view v_votos_por_hora_hoje as
select
  extract(hour from (criado_em at time zone 'America/Sao_Paulo'))::int as hora,
  count(*)::int as total
from votos
where (criado_em at time zone 'America/Sao_Paulo')::date
    = (now() at time zone 'America/Sao_Paulo')::date
group by 1
order by 1;

-- Top 10 subcategorias mais acirradas: menor diferenca entre 1o e 2o lugar.
-- Ja exclui subcats sem candidatos suficientes ou com 0 votos no topo.
create or replace view v_subcats_acirradas as
with ranked as (
  select
    subcategoria_id,
    subcategoria_nome,
    candidato_nome,
    total_votos,
    row_number() over (
      partition by subcategoria_id order by total_votos desc
    ) as posicao
  from v_resultados
)
select
  r1.subcategoria_id,
  r1.subcategoria_nome,
  r1.candidato_nome as primeiro_nome,
  r1.total_votos   as primeiro_votos,
  r2.candidato_nome as segundo_nome,
  r2.total_votos   as segundo_votos,
  (r1.total_votos - r2.total_votos) as diff
from ranked r1
join ranked r2 using (subcategoria_id)
where r1.posicao = 1
  and r2.posicao = 2
  and r1.total_votos > 0
order by diff asc, r1.subcategoria_nome asc
limit 10;

-- Elegiveis pra parcial: validados + ja votaram + ainda nao receberam.
-- EXISTS no Postgres em vez do .in() do PostgREST que trunca em 1000.
-- Ordem por criado_em asc — quem se cadastrou primeiro recebe primeiro.
create or replace function elegiveis_parcial()
returns table (votante_id uuid, votante_nome text, whatsapp text)
language sql
stable
as $$
  select v.id, v.nome, v.whatsapp
  from votantes v
  where v.whatsapp_validado = true
    and v.parcial_enviada_em is null
    and v.whatsapp is not null
    and exists (select 1 from votos where votante_id = v.id)
  order by v.criado_em asc;
$$;
