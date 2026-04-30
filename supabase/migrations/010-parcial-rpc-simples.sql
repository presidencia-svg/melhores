-- ==========================================================================
-- 010-parcial-rpc-simples.sql
--
-- A versao anterior de `parcial_elegives_auto` (migration 009) chamava
-- `parcial_subcats_votante` em lateral join uma vez por votante elegivel.
-- Com 2000+ na fila, isso virava 2000+ queries por execucao do cron e
-- estourava o maxDuration de 300s antes de mandar mensagem nenhuma.
--
-- O filtro de "diff <= 30%" tambem se mostrou pouco util na pratica
-- (pcts inflados em subs com poucos votos). Versao nova ignora o
-- p_max_diff_pct e usa apenas o filtro de min_minutos_apos_voto + os
-- requisitos basicos (validado, com whatsapp, votou, sem parcial ainda).
-- ==========================================================================

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
    100::numeric    as melhor_diff_pct  -- placeholder, RPC nao calcula mais
  from votantes v
  join votos vt on vt.votante_id = v.id
  where v.whatsapp_validado = true
    and v.whatsapp is not null
    and v.parcial_enviada_em is null
  group by v.id, v.nome, v.whatsapp
  having max(vt.criado_em) <= now() - (p_min_minutos_apos_voto || ' minutes')::interval
  order by max(vt.criado_em) asc;
$$;
