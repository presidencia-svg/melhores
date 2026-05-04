-- ==========================================================================
-- 029-view-top6-por-sub.sql
--
-- View pra a pagina /admin/imprensa: top 6 colocados de cada subcategoria
-- com posicao (1-6), votos e categoria. Usada pra gerar uma lista
-- formatada de release pra mandar pra imprensa quando os resultados saem.
--
-- Exclui candidatos com 0 votos (nao deve aparecer na release).
--
-- Roda no SQL Editor do Supabase. Idempotente.
-- ==========================================================================

create or replace view v_top6_por_sub as
with ranked as (
  select
    r.subcategoria_id,
    r.subcategoria_nome,
    r.categoria_id,
    r.categoria_nome,
    r.candidato_id,
    r.candidato_nome,
    r.total_votos,
    row_number() over (
      partition by r.subcategoria_id
      order by r.total_votos desc, r.candidato_nome
    )::int as posicao
  from v_resultados r
  where r.total_votos > 0
)
select *
from ranked
where posicao <= 6
order by categoria_nome, subcategoria_nome, posicao;
