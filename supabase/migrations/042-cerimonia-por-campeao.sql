-- ==========================================================================
-- 042-cerimonia-por-campeao.sql
--
-- Refina o blast de cerimonia: em vez de notificar TODO mundo que votou em
-- algum campeao (~16k votantes), seleciona ate N votantes por campeao
-- (default 10) e dedup entre campeoes. Pra cada votante selecionado, lista
-- todos os campeoes que ele votou (cap nos primeiros 3 no body).
--
-- Resultado pratico: 105 campeoes * 10 = 1050 limite superior; com dedup
-- (votante vota em ~4.4 subs) o numero real fica menor.
--
-- Ordem de selecao por criado_em ASC — quem se cadastrou primeiro tem
-- prioridade (votante mais engajado historicamente).
--
-- Substitui a RPC criada em 041 — depende dela. Roda apos 041.
-- ==========================================================================

drop function if exists elegiveis_cerimonia(uuid);

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
    -- top1 de cada subcategoria + top2 em empate tecnico
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
    select
      c.campeao_id,
      vt.id as votante_id,
      vt.criado_em,
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
      and vt.cerimonia_enviada_em is null
  ),
  selected_voters as (
    -- Apenas votantes que ficaram no top N de algum campeao
    select distinct votante_id
    from voters_per_champion
    where pos <= p_por_campeao
  ),
  voter_champions as (
    -- Pra cada selecionado, TODOS os campeoes que ele votou (nao so os do
    -- top N onde ele entrou) — assim a msg lista os 3 mais relevantes
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
