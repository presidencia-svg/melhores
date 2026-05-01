-- ==========================================================================
-- 015-parcial-roi.sql
--
-- RPC pra calcular ROI da auto-parcial (e parciais manuais), igual ao
-- existente insights_incentivo_roi mas baseado em votantes.parcial_enviada_em.
--
-- Diferente do incentivo, a parcial nao tem tabela de log com canal/motivo
-- (parcial_enviada_em e 1 timestamp por pessoa, lifetime). Por isso a
-- agregacao e total no periodo, sem split.
-- ==========================================================================

create or replace function insights_parcial_roi(dias int default 7)
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
    where v.parcial_enviada_em is not null
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
