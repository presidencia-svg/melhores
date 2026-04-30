-- ==========================================================================
-- 013-cooldown-global-24h.sql
--
-- Cooldown de 24h cross-campaign: depois de qualquer zap enviado pra um
-- votante, ele so pode receber de novo 24h depois — independente de qual
-- campanha foi (parcial, incentivo manual ou auto-empate).
--
-- Implementacao: as duas RPCs de elegibilidade passam a checar AMBOS
-- timestamps em votantes (parcial_enviada_em, incentivo_enviado_em).
--
-- 1. parcial_elegives_auto: alem de parcial_enviada_em IS NULL (lifetime),
--    bloqueia tambem quem recebeu incentivo nas ultimas 24h.
-- 2. incentivo_elegives_empate: alem do cooldown proprio, bloqueia quem
--    recebeu parcial nas ultimas 24h.
-- ==========================================================================

-- 1. parcial_elegives_auto — adiciona filtro cross-campaign
create or replace function parcial_elegives_auto(
  p_min_minutos_apos_voto int default 30,
  p_max_diff_pct int default 100  -- mantido por compat, ignorado
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
  where v.whatsapp_validado = true
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

-- 2. incentivo_elegives_empate — adiciona filtro cross-campaign na clausula final
create or replace function incentivo_elegives_empate(
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
  where vt.whatsapp_validado = true
    and vt.whatsapp is not null
    -- cooldown da propria campanha (incentivo)
    and (
      vt.incentivo_enviado_em is null
      or vt.incentivo_enviado_em < now() - (p_cooldown_horas || ' hours')::interval
    )
    -- cooldown cross-campaign: parcial enviada nas ultimas 24h tambem bloqueia
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
