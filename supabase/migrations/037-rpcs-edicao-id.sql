-- ==========================================================================
-- 037-rpcs-edicao-id.sql
--
-- Ultimo passo do tenant scoping: RPCs e v_votos_velocidade_48h ainda
-- agregavam global. Recria todas com primeiro param p_edicao_id (uuid).
--
-- Afetadas:
--   - insights_funil(p_edicao_id, dias)
--   - insights_incentivo_roi(p_edicao_id, dias)
--   - insights_parcial_roi(p_edicao_id, dias)
--   - insights_votos_heatmap(p_edicao_id, dias)
--   - insights_subs_aceleracao(p_edicao_id)
--   - insights_origem(p_edicao_id, dias)
--   - insights_otp_periodo(p_edicao_id, dias)
--   - insights_votos_periodo(p_edicao_id, dias)
--   - incentivo_elegives(p_edicao_id, p_threshold, p_min_minutos_apos_voto)
--   - incentivo_elegives_empate(p_edicao_id, p_cooldown_horas, p_min_minutos_apos_voto)
--   - parcial_elegives_auto(p_edicao_id, p_min_minutos_apos_voto, p_max_diff_pct)
--   - v_votos_velocidade_48h (projeta edicao_id)
--
-- parcial_subcats_votante(p_votante_id) NAO muda — escopo ja transitivo
-- via votante.edicao_id.
--
-- Dropa as assinaturas antigas pra forcar callers a especificar tenant.
-- DEPENDE da migration 036.
-- ==========================================================================

-- ==========================================================================
-- 1. v_votos_velocidade_48h
-- ==========================================================================

drop view if exists v_votos_velocidade_48h cascade;

create view v_votos_velocidade_48h as
with edicoes as (select distinct edicao_id from votos),
horas as (
  select
    e.edicao_id,
    h.hora
  from edicoes e
  cross join lateral generate_series(
    date_trunc('hour', now() - interval '47 hours'),
    date_trunc('hour', now()),
    interval '1 hour'
  ) as h(hora)
),
votos_hora as (
  select
    edicao_id,
    date_trunc('hour', criado_em) as hora,
    count(*)::bigint as total
  from votos
  where criado_em >= now() - interval '48 hours'
  group by edicao_id, date_trunc('hour', criado_em)
)
select
  h.edicao_id,
  h.hora,
  coalesce(vh.total, 0)::bigint as total
from horas h
left join votos_hora vh
  on vh.edicao_id = h.edicao_id and vh.hora = h.hora
order by h.edicao_id, h.hora;

-- ==========================================================================
-- 2. insights_* RPCs
-- ==========================================================================

drop function if exists insights_funil(int);

create function insights_funil(p_edicao_id uuid, dias int default 7)
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
    select v.id, v.spc_validado, v.whatsapp_validado
    from votantes v
    where v.edicao_id = p_edicao_id
      and v.criado_em >= now() - (dias || ' days')::interval
  ),
  votos_por_votante as (
    select v.id as votante_id, count(distinct vt.subcategoria_id)::bigint as subs_votadas
    from periodo v
    left join votos vt on vt.votante_id = v.id
    group by v.id
  )
  select
    (select count(*) from periodo)::bigint                                  as cadastros,
    (select count(*) from periodo where spc_validado)::bigint               as spc_validados,
    (select count(*) from periodo where whatsapp_validado)::bigint          as wa_validados,
    (select count(*) from votos_por_votante where subs_votadas > 0)::bigint as votaram,
    (select count(*) from votos_por_votante where subs_votadas >= 85)::bigint as completaram;
$$;

drop function if exists insights_incentivo_roi(int);

create function insights_incentivo_roi(p_edicao_id uuid, dias int default 7)
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
    select l.id, l.votante_id, l.motivo, coalesce(l.canal, 'desconhecido') as canal, l.criado_em
    from incentivo_envios_log l
    join votantes v on v.id = l.votante_id
    where v.edicao_id = p_edicao_id
      and l.criado_em >= now() - (dias || ' days')::interval
  ),
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

drop function if exists insights_parcial_roi(int);

create function insights_parcial_roi(p_edicao_id uuid, dias int default 7)
returns table (
  enviados bigint,
  converteram bigint,
  votos_gerados bigint
)
language sql
stable
as $$
  with envios as (
    select
      v.id as votante_id,
      v.parcial_enviada_em as enviado_em
    from votantes v
    where v.edicao_id = p_edicao_id
      and v.parcial_enviada_em is not null
      and v.parcial_enviada_em >= now() - (dias || ' days')::interval
  ),
  por_envio as (
    select
      e.votante_id,
      count(vt.id)::bigint as qtd_votos_apos
    from envios e
    left join votos vt
      on vt.votante_id = e.votante_id
     and vt.criado_em > e.enviado_em
     and vt.criado_em < e.enviado_em + interval '24 hours'
    group by e.votante_id
  )
  select
    count(*)::bigint                                  as enviados,
    count(*) filter (where qtd_votos_apos > 0)::bigint as converteram,
    coalesce(sum(qtd_votos_apos), 0)::bigint           as votos_gerados
  from por_envio;
$$;

drop function if exists insights_votos_heatmap(int);

create function insights_votos_heatmap(p_edicao_id uuid, dias int default 14)
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
  where edicao_id = p_edicao_id
    and criado_em >= now() - (dias || ' days')::interval
  group by 1, 2;
$$;

drop function if exists insights_subs_aceleracao();

create function insights_subs_aceleracao(p_edicao_id uuid)
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
    where v.edicao_id = p_edicao_id
      and v.criado_em >= now() - interval '48 hours'
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

drop function if exists insights_origem(int);

create function insights_origem(p_edicao_id uuid, dias int default 7)
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
        when user_agent ilike '%mobile%' or user_agent ilike '%android%'
          or user_agent ilike '%iphone%' or user_agent ilike '%ipad%' then 'mobile'
        when user_agent is null or user_agent = '' then 'desconhecido'
        else 'desktop'
      end as origem
    from votantes
    where edicao_id = p_edicao_id
      and criado_em >= now() - (dias || ' days')::interval
  )
  select origem, count(*)::bigint as total
  from classificado
  group by origem
  order by total desc;
$$;

drop function if exists insights_otp_periodo(int);

create function insights_otp_periodo(p_edicao_id uuid, dias int default 7)
returns table (total bigint, validados bigint, tentativas_media numeric)
language sql
stable
as $$
  select
    count(*)::bigint                                                    as total,
    count(*) filter (where w.validado)::bigint                          as validados,
    coalesce(avg(w.tentativas), 0)::numeric(10,2)                       as tentativas_media
  from whatsapp_codigos w
  join votantes vt on vt.id = w.votante_id
  where vt.edicao_id = p_edicao_id
    and w.criado_em >= now() - (dias || ' days')::interval;
$$;

drop function if exists insights_votos_periodo(int);

create function insights_votos_periodo(p_edicao_id uuid, dias int default 7)
returns table (total bigint, votantes_unicos bigint)
language sql
stable
as $$
  select
    count(*)::bigint                       as total,
    count(distinct votante_id)::bigint     as votantes_unicos
  from votos
  where edicao_id = p_edicao_id
    and criado_em >= now() - (dias || ' days')::interval;
$$;

-- ==========================================================================
-- 3. RPCs de elegibilidade (cron + admin/disparar)
-- ==========================================================================

drop function if exists incentivo_elegives(int, int);

create function incentivo_elegives(
  p_edicao_id uuid,
  p_threshold int default 5,
  p_min_minutos_apos_voto int default 30
)
returns table (
  votante_id uuid,
  votante_nome text,
  whatsapp text,
  categoria_nome text,
  subcategoria_id uuid,
  subcategoria_nome text,
  candidato_perdendo_id uuid,
  candidato_perdendo_nome text,
  candidato_perdendo_votos bigint,
  candidato_lider_nome text,
  candidato_lider_votos bigint,
  diferenca bigint
)
language sql stable as $$
  with ranked as (
    select
      c.id as candidato_id,
      c.nome as candidato_nome,
      c.subcategoria_id,
      s.nome as subcategoria_nome,
      cat.nome as categoria_nome,
      count(v.id) as votos,
      row_number() over (
        partition by c.subcategoria_id
        order by count(v.id) desc, c.nome
      ) as rk
    from candidatos c
    join subcategorias s on s.id = c.subcategoria_id
    join categorias cat on cat.id = s.categoria_id
    left join votos v on v.candidato_id = c.id
    where c.status = 'aprovado'
      and c.edicao_id = p_edicao_id
    group by c.id, s.id, cat.id
  ),
  acirradas as (
    select
      t1.subcategoria_id,
      t1.subcategoria_nome,
      t1.categoria_nome,
      t1.candidato_id as top1_id,
      t1.candidato_nome as top1_nome,
      t1.votos as top1_votos,
      t2.candidato_id as top2_id,
      t2.candidato_nome as top2_nome,
      t2.votos as top2_votos,
      (t1.votos - t2.votos) as diff
    from ranked t1
    join ranked t2
      on t2.subcategoria_id = t1.subcategoria_id
     and t2.rk = 2
    where t1.rk = 1
      and (t1.votos - t2.votos) > 0
      and (t1.votos - t2.votos) <= p_threshold
  )
  select
    vt.id,
    vt.nome,
    vt.whatsapp,
    a.categoria_nome,
    a.subcategoria_id,
    a.subcategoria_nome,
    a.top2_id,
    a.top2_nome,
    a.top2_votos,
    a.top1_nome,
    a.top1_votos,
    a.diff
  from acirradas a
  join votos v on v.candidato_id = a.top2_id
  join votantes vt on vt.id = v.votante_id
  where vt.edicao_id = p_edicao_id
    and vt.whatsapp_validado = true
    and vt.whatsapp is not null
    and vt.incentivo_enviado_em is null
    and not exists (
      select 1 from votos v2
      where v2.votante_id = vt.id
        and v2.criado_em > now() - (p_min_minutos_apos_voto || ' minutes')::interval
    )
  order by a.diff asc, a.subcategoria_nome, vt.nome;
$$;

drop function if exists incentivo_elegives_empate(int, int);

create function incentivo_elegives_empate(
  p_edicao_id uuid,
  p_cooldown_horas int default 24,
  p_min_minutos_apos_voto int default 30
)
returns table (
  votante_id uuid,
  votante_nome text,
  whatsapp text,
  categoria_nome text,
  subcategoria_id uuid,
  subcategoria_nome text,
  candidato_perdendo_id uuid,
  candidato_perdendo_nome text,
  candidato_perdendo_votos bigint,
  candidato_lider_nome text,
  candidato_lider_votos bigint,
  diferenca bigint
)
language sql stable as $$
  with ranked as (
    select
      c.id as candidato_id,
      c.nome as candidato_nome,
      c.subcategoria_id,
      s.nome as subcategoria_nome,
      cat.nome as categoria_nome,
      count(v.id) as votos,
      row_number() over (
        partition by c.subcategoria_id
        order by count(v.id) desc, c.nome
      ) as rk
    from candidatos c
    join subcategorias s on s.id = c.subcategoria_id
    join categorias cat on cat.id = s.categoria_id
    left join votos v on v.candidato_id = c.id
    where c.status = 'aprovado'
      and c.edicao_id = p_edicao_id
    group by c.id, s.id, cat.id
  ),
  empates as (
    select
      t1.subcategoria_id, t1.subcategoria_nome, t1.categoria_nome,
      t1.candidato_id as top1_id, t1.candidato_nome as top1_nome, t1.votos as top1_votos,
      t2.candidato_id as top2_id, t2.candidato_nome as top2_nome, t2.votos as top2_votos
    from ranked t1
    join ranked t2 on t2.subcategoria_id = t1.subcategoria_id and t2.rk = 2
    where t1.rk = 1 and t1.votos = t2.votos and t1.votos > 0
  ),
  alvos as (
    select
      e.subcategoria_id, e.subcategoria_nome, e.categoria_nome,
      e.top1_id as candidato_perdendo_id, e.top1_nome as candidato_perdendo_nome,
      e.top1_votos as candidato_perdendo_votos,
      e.top2_nome as candidato_lider_nome, e.top2_votos as candidato_lider_votos
    from empates e
    union all
    select
      e.subcategoria_id, e.subcategoria_nome, e.categoria_nome,
      e.top2_id, e.top2_nome, e.top2_votos,
      e.top1_nome, e.top1_votos
    from empates e
  )
  select
    vt.id, vt.nome, vt.whatsapp,
    a.categoria_nome, a.subcategoria_id, a.subcategoria_nome,
    a.candidato_perdendo_id, a.candidato_perdendo_nome, a.candidato_perdendo_votos,
    a.candidato_lider_nome, a.candidato_lider_votos,
    (a.candidato_perdendo_votos - a.candidato_lider_votos) as diferenca
  from alvos a
  join votos v on v.candidato_id = a.candidato_perdendo_id
  join votantes vt on vt.id = v.votante_id
  where vt.edicao_id = p_edicao_id
    and vt.whatsapp_validado = true
    and vt.whatsapp is not null
    and (
      vt.incentivo_enviado_em is null
      or vt.incentivo_enviado_em < now() - (p_cooldown_horas || ' hours')::interval
    )
    and (
      vt.parcial_enviada_em is null
      or vt.parcial_enviada_em < now() - interval '24 hours'
    )
    and not exists (
      select 1 from votos v2
      where v2.votante_id = vt.id
        and v2.criado_em > now() - (p_min_minutos_apos_voto || ' minutes')::interval
    )
  order by a.subcategoria_nome, vt.nome;
$$;

drop function if exists parcial_elegives_auto(int, int);

create function parcial_elegives_auto(
  p_edicao_id uuid,
  p_min_minutos_apos_voto int default 30,
  p_max_diff_pct int default 100
)
returns table (
  votante_id uuid,
  votante_nome text,
  whatsapp text,
  ultimo_voto_em timestamptz,
  melhor_diff_pct numeric
)
language sql
stable
as $$
  select
    v.id            as votante_id,
    v.nome          as votante_nome,
    v.whatsapp      as whatsapp,
    max(vt.criado_em) as ultimo_voto_em,
    100::numeric    as melhor_diff_pct
  from votantes v
  join votos vt on vt.votante_id = v.id
  where v.edicao_id = p_edicao_id
    and v.whatsapp_validado = true
    and v.whatsapp is not null
    and v.parcial_enviada_em is null
    and (
      v.incentivo_enviado_em is null
      or v.incentivo_enviado_em < now() - interval '24 hours'
    )
  group by v.id, v.nome, v.whatsapp
  having max(vt.criado_em) <= now() - (p_min_minutos_apos_voto || ' minutes')::interval
  order by max(vt.criado_em) asc;
$$;
