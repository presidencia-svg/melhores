-- ==========================================================================
-- 016-funil-completaram-85.sql
--
-- Quase ninguem vota em 100% das subcategorias (sempre tem categoria que a
-- pessoa nao conhece e pula). Antes: completou = votou em TODAS as subs
-- ativas — metrica artificialmente baixa. Agora: votou em >= 85 subs ja
-- conta como "completaram".
--
-- 85 e o limite combinado com o cliente; pode ser ajustado depois trocando
-- a constante MIN_SUBS_COMPLETAR no SELECT.
-- ==========================================================================

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
