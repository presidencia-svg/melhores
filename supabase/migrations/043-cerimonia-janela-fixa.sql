-- ==========================================================================
-- 043-cerimonia-janela-fixa.sql
--
-- FIX: a RPC criada em 042 rankeava top N por campeao SOMENTE entre quem
-- ainda nao tinha recebido (cerimonia_enviada_em IS NULL dentro do
-- partition). Resultado: quando um votante recebia, a posicao 11 dele
-- subia pra 10 e novos elegiveis apareciam. Fila nao diminuia.
--
-- Agora rankeia TODOS os validados por campeao (incluindo quem ja
-- recebeu) e filtra cerimonia_enviada_em apos a selecao. Top N por
-- campeao vira um conjunto fixo — fila diminui 1:1 conforme envia.
--
-- Substitui a RPC criada em 042 — depende dela.
-- ==========================================================================

drop function if exists elegiveis_cerimonia(uuid, int);

create or replace function elegiveis_cerimonia(
  p_edicao_id uuid,
  p_por_campeao int default 10
)
returns table (
  votante_id uuid,
  votante_nome text,
  whatsapp text,
  criado_em timestamptz,
  campeoes_nomes text[]
)
language sql
stable
as $$
  with campeoes as (
    select p.top1_id as campeao_id, p.top1_nome as campeao_nome
    from v_podium p
    where p.edicao_id = p_edicao_id and p.top1_votos > 0
    union
    select p.top2_id, p.top2_nome
    from v_podium p
    where p.edicao_id = p_edicao_id
      and p.top2_id is not null
      and p.top1_votos > 0
      and p.top2_votos = p.top1_votos
  ),
  voters_per_champion as (
    -- Rankeia TODOS os validados (incluindo ja-enviados) pra que o top N
    -- seja estavel ao longo do tempo.
    select
      c.campeao_id,
      vt.id as votante_id,
      vt.cerimonia_enviada_em,
      row_number() over (
        partition by c.campeao_id
        order by vt.criado_em asc
      ) as pos
    from campeoes c
    join votos v on v.candidato_id = c.campeao_id and v.edicao_id = p_edicao_id
    join votantes vt on vt.id = v.votante_id
      and vt.edicao_id = p_edicao_id
      and vt.whatsapp_validado = true
      and vt.whatsapp is not null
  ),
  selected_voters as (
    -- Aplica o cap apos o ranking. Exclui quem ja recebeu.
    select distinct votante_id
    from voters_per_champion
    where pos <= p_por_campeao
      and cerimonia_enviada_em is null
  ),
  voter_champions as (
    select sv.votante_id, c.campeao_nome
    from selected_voters sv
    join votos v on v.votante_id = sv.votante_id and v.edicao_id = p_edicao_id
    join campeoes c on c.campeao_id = v.candidato_id
  ),
  grouped as (
    select
      votante_id,
      array_agg(distinct campeao_nome order by campeao_nome) as campeoes_nomes
    from voter_champions
    group by votante_id
  )
  select
    g.votante_id,
    vt.nome,
    vt.whatsapp,
    vt.criado_em,
    g.campeoes_nomes
  from grouped g
  join votantes vt on vt.id = g.votante_id
  order by vt.criado_em asc;
$$;
