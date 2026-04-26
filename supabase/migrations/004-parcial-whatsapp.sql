-- ==========================================================================
-- Disparo de "parcial" via WhatsApp para votantes:
--   1 mensagem com top 3 (+ %) de até 3 subcategorias mais acirradas
--   onde o votante votou.
--
-- 1. Adiciona timestamp pra evitar reenvio.
-- 2. Função RPC `parcial_subcats_votante(votante_id)` retorna até 3 linhas
--    por candidato (top 3) das 3 subcategorias mais acirradas onde o
--    votante tem voto. Se ele votou em menos de 3 subcategorias, retorna
--    todas que ele votou.
-- ==========================================================================

alter table votantes
  add column if not exists parcial_enviada_em timestamptz;

create index if not exists idx_votantes_parcial
  on votantes(parcial_enviada_em)
  where whatsapp_validado = true;

create or replace function parcial_subcats_votante(p_votante_id uuid)
returns table (
  subcategoria_id uuid,
  subcategoria_nome text,
  categoria_nome text,
  pos int,
  candidato_nome text,
  votos bigint,
  pct numeric,
  total_subcat bigint,
  diff_top12 bigint
)
language sql stable as $$
  with subcats_votadas as (
    select distinct v.subcategoria_id
    from votos v
    where v.votante_id = p_votante_id
  ),
  ranked as (
    select
      c.subcategoria_id,
      s.nome as subcategoria_nome,
      cat.nome as categoria_nome,
      c.nome as candidato_nome,
      count(v.id) as votos,
      row_number() over (
        partition by c.subcategoria_id
        order by count(v.id) desc, c.nome
      ) as pos
    from candidatos c
    join subcategorias s on s.id = c.subcategoria_id
    join categorias cat on cat.id = s.categoria_id
    join subcats_votadas sv on sv.subcategoria_id = c.subcategoria_id
    left join votos v on v.candidato_id = c.id
    where c.status = 'aprovado'
    group by c.id, s.id, cat.id
  ),
  agregado as (
    select
      subcategoria_id,
      sum(votos) as total,
      max(case when pos = 1 then votos end) -
        coalesce(max(case when pos = 2 then votos end), 0) as diff
    from ranked
    group by subcategoria_id
  ),
  top3_acirradas as (
    select subcategoria_id
    from agregado
    order by diff asc, subcategoria_id
    limit 3
  )
  select
    r.subcategoria_id,
    r.subcategoria_nome,
    r.categoria_nome,
    r.pos::int,
    r.candidato_nome,
    r.votos,
    case when a.total > 0 then round(r.votos * 100.0 / a.total, 0) else 0 end as pct,
    a.total,
    a.diff
  from ranked r
  join agregado a on a.subcategoria_id = r.subcategoria_id
  join top3_acirradas t on t.subcategoria_id = r.subcategoria_id
  where r.pos <= 3
  order by a.diff asc, r.subcategoria_nome, r.pos;
$$;
