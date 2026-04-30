-- ==========================================================================
-- 008-insights-internos.sql
--
-- Views/RPCs pra alimentar a pagina /admin/whatsapp/insights com dados
-- internos (Supabase) — independente da Meta Cloud API que pode estar zerada.
--
-- Roda no SQL Editor do Supabase apos deploy. Tudo idempotente.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. Funil de conversao
-- Cadastro -> SPC validado -> WhatsApp validado -> 1o voto -> votou em todas.
-- "todas" = qtd de subcategorias ativas da edicao do votante.
-- --------------------------------------------------------------------------
create or replace function insights_funil(dias int default 7)
returns table (
  cadastros bigint,
  spc_validados bigint,
  wa_validados bigint,
  votaram bigint,
  completaram bigint
)
language sql
stable
as $$
  with periodo as (
    select v.id, v.edicao_id, v.spc_validado, v.whatsapp_validado
    from votantes v
    where v.criado_em >= now() - (dias || ' days')::interval
  ),
  subs_por_edicao as (
    select c.edicao_id, count(*)::bigint as total_subs
    from subcategorias s
    join categorias c on c.id = s.categoria_id
    where s.ativa = true and c.ativa = true
    group by c.edicao_id
  ),
  votos_por_votante as (
    select v.id as votante_id, v.edicao_id, count(distinct vt.subcategoria_id)::bigint as subs_votadas
    from periodo v
    left join votos vt on vt.votante_id = v.id
    group by v.id, v.edicao_id
  )
  select
    (select count(*) from periodo)::bigint                                  as cadastros,
    (select count(*) from periodo where spc_validado)::bigint               as spc_validados,
    (select count(*) from periodo where whatsapp_validado)::bigint          as wa_validados,
    (select count(*) from votos_por_votante where subs_votadas > 0)::bigint as votaram,
    (select count(*)
       from votos_por_votante vv
       join subs_por_edicao se on se.edicao_id = vv.edicao_id
       where vv.subs_votadas >= se.total_subs)::bigint                      as completaram;
$$;

-- --------------------------------------------------------------------------
-- 2. ROI do incentivo
-- Dos envios nos ultimos N dias, quantos votantes registraram um voto NOVO
-- (criado depois do envio, em ate 24h) — quebrado por canal e motivo.
-- --------------------------------------------------------------------------
create or replace function insights_incentivo_roi(dias int default 7)
returns table (
  motivo text,
  canal text,
  enviados bigint,
  converteram bigint,
  votos_gerados bigint
)
language sql
stable
as $$
  with envios as (
    select id, votante_id, motivo, coalesce(canal, 'desconhecido') as canal, criado_em
    from incentivo_envios_log
    where criado_em >= now() - (dias || ' days')::interval
  ),
  -- conta votos novos por envio (em ate 24h depois)
  votos_novos as (
    select
      e.id as envio_id, e.motivo, e.canal, e.votante_id,
      count(vt.id)::bigint as qtd_votos
    from envios e
    left join votos vt
      on vt.votante_id = e.votante_id
     and vt.criado_em > e.criado_em
     and vt.criado_em < e.criado_em + interval '24 hours'
    group by 1,2,3,4
  )
  select
    motivo,
    canal,
    count(*)::bigint                                  as enviados,
    count(*) filter (where qtd_votos > 0)::bigint     as converteram,
    coalesce(sum(qtd_votos), 0)::bigint               as votos_gerados
  from votos_novos
  group by motivo, canal
  order by enviados desc;
$$;

-- --------------------------------------------------------------------------
-- 3. Heatmap votos: dow (0=domingo..6=sabado) x hora (0..23)
-- Periodo configuravel em dias (default 14).
-- --------------------------------------------------------------------------
create or replace function insights_votos_heatmap(dias int default 14)
returns table (
  dow int,
  hora int,
  total bigint
)
language sql
stable
as $$
  select
    extract(dow  from (criado_em at time zone 'America/Maceio'))::int as dow,
    extract(hour from (criado_em at time zone 'America/Maceio'))::int as hora,
    count(*)::bigint                                                  as total
  from votos
  where criado_em >= now() - (dias || ' days')::interval
  group by 1, 2;
$$;

-- --------------------------------------------------------------------------
-- 4. Velocidade de votacao — votos por hora nas ultimas 48h
-- Retorna 1 linha por hora cheia, 0 quando nao houve voto.
-- --------------------------------------------------------------------------
create or replace view v_votos_velocidade_48h as
with horas as (
  select generate_series(
    date_trunc('hour', now() - interval '47 hours'),
    date_trunc('hour', now()),
    interval '1 hour'
  ) as hora
),
votos_hora as (
  select date_trunc('hour', criado_em) as hora, count(*)::bigint as total
  from votos
  where criado_em >= now() - interval '48 hours'
  group by 1
)
select
  h.hora,
  coalesce(vh.total, 0)::bigint as total
from horas h
left join votos_hora vh using (hora)
order by h.hora;

-- --------------------------------------------------------------------------
-- 5. Subcategorias em aceleracao
-- Top 10 com maior crescimento absoluto nas ultimas 24h vs 24h anteriores.
-- --------------------------------------------------------------------------
create or replace function insights_subs_aceleracao()
returns table (
  subcategoria_id uuid,
  subcategoria_nome text,
  votos_24h bigint,
  votos_24h_antes bigint,
  delta bigint
)
language sql
stable
as $$
  with periodos as (
    select
      v.subcategoria_id,
      count(*) filter (
        where v.criado_em >= now() - interval '24 hours'
      )::bigint as votos_24h,
      count(*) filter (
        where v.criado_em >= now() - interval '48 hours'
          and v.criado_em <  now() - interval '24 hours'
      )::bigint as votos_24h_antes
    from votos v
    where v.criado_em >= now() - interval '48 hours'
    group by v.subcategoria_id
  )
  select
    p.subcategoria_id,
    s.nome as subcategoria_nome,
    p.votos_24h,
    p.votos_24h_antes,
    (p.votos_24h - p.votos_24h_antes)::bigint as delta
  from periodos p
  join subcategorias s on s.id = p.subcategoria_id
  where p.votos_24h > 0
  order by delta desc, p.votos_24h desc
  limit 10;
$$;

-- --------------------------------------------------------------------------
-- 6. Origem dos votantes — agrupamento basico de user_agent.
-- Classificacao feita aqui no banco pra evitar trafego desnecessario.
-- --------------------------------------------------------------------------
create or replace function insights_origem(dias int default 7)
returns table (
  origem text,
  total bigint
)
language sql
stable
as $$
  with classificado as (
    select
      case
        when user_agent is null or user_agent = '' then 'desconhecido'
        when user_agent ~* 'iphone|ipad|ipod'                then 'ios'
        when user_agent ~* 'android'                         then 'android'
        when user_agent ~* 'macintosh|mac os'                then 'mac'
        when user_agent ~* 'windows'                         then 'windows'
        when user_agent ~* 'linux|x11'                       then 'linux'
        else 'outro'
      end as origem
    from votantes
    where criado_em >= now() - (dias || ' days')::interval
  )
  select origem, count(*)::bigint as total
  from classificado
  group by origem
  order by total desc;
$$;
