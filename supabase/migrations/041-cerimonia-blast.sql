-- ==========================================================================
-- 041-cerimonia-blast.sql
--
-- Disparo de aviso de cerimonia (entrega dos certificados) via WhatsApp
-- para todos os votantes que escolheram algum CAMPEAO (top1 de qualquer
-- subcategoria, +top2 em caso de empate tecnico).
--
-- Regra de dedup: 1 mensagem por votante, mesmo que tenha votado em N
-- campeoes diferentes. Coluna cerimonia_enviada_em controla reenvio.
--
-- RPC elegiveis_cerimonia(p_edicao_id uuid) segue o padrao das outras:
--   - filtra por edicao (multi-tenant scoping)
--   - so traz quem ainda nao recebeu
--   - so quem tem whatsapp validado
--   - ordena por criado_em asc (quem cadastrou primeiro recebe primeiro)
--
-- Roda no SQL Editor do Supabase. Idempotente.
-- ==========================================================================

alter table votantes
  add column if not exists cerimonia_enviada_em timestamptz;

create index if not exists idx_votantes_cerimonia
  on votantes(cerimonia_enviada_em)
  where whatsapp_validado = true;

create or replace function elegiveis_cerimonia(p_edicao_id uuid)
returns table (
  votante_id uuid,
  votante_nome text,
  whatsapp text,
  criado_em timestamptz,
  campeoes_votados bigint
)
language sql
stable
as $$
  with campeoes as (
    -- top1 de cada subcategoria + top2 quando empate tecnico de 1o lugar.
    -- candidato_id da v_podium ja vem filtrada pela edicao via subcategoria.
    select p.top1_id as candidato_id
    from v_podium p
    where p.edicao_id = p_edicao_id and p.top1_votos > 0
    union
    select p.top2_id
    from v_podium p
    where p.edicao_id = p_edicao_id
      and p.top2_id is not null
      and p.top1_votos > 0
      and p.top2_votos = p.top1_votos
  )
  select
    v.id,
    v.nome,
    v.whatsapp,
    v.criado_em,
    (
      select count(distinct vt.candidato_id)::bigint
      from votos vt
      where vt.votante_id = v.id
        and vt.candidato_id in (select candidato_id from campeoes)
    ) as campeoes_votados
  from votantes v
  where v.edicao_id = p_edicao_id
    and v.whatsapp_validado = true
    and v.cerimonia_enviada_em is null
    and v.whatsapp is not null
    and exists (
      select 1
      from votos vt
      where vt.votante_id = v.id
        and vt.candidato_id in (select candidato_id from campeoes)
    )
  order by v.criado_em asc;
$$;
