-- ==========================================================================
-- Cooldown entre o último voto do votante e o disparo do incentivo.
-- Atualiza a função `incentivo_elegives` aceitando um parâmetro extra
-- `p_min_minutos_apos_voto` (default 30) — só retorna quem votou pela
-- última vez há mais que esse intervalo.
-- ==========================================================================

create or replace function incentivo_elegives(
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
  where vt.whatsapp_validado = true
    and vt.whatsapp is not null
    and vt.incentivo_enviado_em is null
    and not exists (
      select 1 from votos v2
      where v2.votante_id = vt.id
        and v2.criado_em > now() - (p_min_minutos_apos_voto || ' minutes')::interval
    )
  order by a.diff asc, a.subcategoria_nome, vt.nome;
$$;
