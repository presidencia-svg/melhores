-- ==========================================================================
-- 017-view-podium.sql
--
-- View pra pagina /admin/podium — top 1, 2 e 3 de cada subcategoria com
-- pct sobre o total de votos da sub. Usado pra gerar cards de "Resultado
-- final" pra postar no Instagram quando a votacao encerrar.
-- ==========================================================================

create or replace view v_podium as
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
    ) as pos,
    sum(r.total_votos) over (partition by r.subcategoria_id) as total_subcat
  from v_resultados r
),
agg as (
  select
    r1.subcategoria_id,
    r1.subcategoria_nome,
    r1.total_subcat,
    -- top1 (sempre existe)
    r1.candidato_id   as top1_id,
    r1.candidato_nome as top1_nome,
    r1.foto_url       as top1_foto,
    r1.total_votos::bigint as top1_votos,
    -- top2 (pode nao existir se sub so tem 1 candidato)
    r2.candidato_id   as top2_id,
    r2.candidato_nome as top2_nome,
    r2.foto_url       as top2_foto,
    coalesce(r2.total_votos, 0)::bigint as top2_votos,
    -- top3 (idem)
    r3.candidato_id   as top3_id,
    r3.candidato_nome as top3_nome,
    r3.foto_url       as top3_foto,
    coalesce(r3.total_votos, 0)::bigint as top3_votos
  from ranked r1
  left join ranked r2 on r2.subcategoria_id = r1.subcategoria_id and r2.pos = 2
  left join ranked r3 on r3.subcategoria_id = r1.subcategoria_id and r3.pos = 3
  where r1.pos = 1
    and r1.total_votos > 0
)
select * from agg;
