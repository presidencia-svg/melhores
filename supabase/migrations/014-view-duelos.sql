-- ==========================================================================
-- 014-view-duelos.sql
--
-- View pra pagina de "duelos" — pega top1 vs top2 de cada subcategoria
-- com pelo menos 2 candidatos com voto. Usado no admin pra gerar cards
-- pra postar no Instagram com a disputa mais quente.
-- ==========================================================================

create or replace view v_duelos as
with ranked as (
  select
    r.subcategoria_id,
    r.subcategoria_nome,
    r.candidato_id,
    r.candidato_nome,
    r.foto_url,
    r.total_votos,
    row_number() over (
      partition by r.subcategoria_id
      order by r.total_votos desc, r.candidato_nome
    ) as pos
  from v_resultados r
)
select
  r1.subcategoria_id,
  r1.subcategoria_nome,
  r1.candidato_id   as top1_id,
  r1.candidato_nome as top1_nome,
  r1.foto_url       as top1_foto,
  r1.total_votos::bigint as top1_votos,
  r2.candidato_id   as top2_id,
  r2.candidato_nome as top2_nome,
  r2.foto_url       as top2_foto,
  r2.total_votos::bigint as top2_votos,
  (r1.total_votos + r2.total_votos)::bigint as total_votos,
  (r1.total_votos - r2.total_votos)::bigint as diff,
  case
    when (r1.total_votos + r2.total_votos) > 0
    then round((r1.total_votos - r2.total_votos)::numeric * 100
                / (r1.total_votos + r2.total_votos), 1)
    else 0
  end as diff_pct
from ranked r1
join ranked r2 using (subcategoria_id)
where r1.pos = 1
  and r2.pos = 2
  and r1.total_votos > 0;
