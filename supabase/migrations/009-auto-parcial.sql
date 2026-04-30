-- ==========================================================================
-- 009-auto-parcial.sql
--
-- Automatiza disparo de parcial personalizada com a mesma estetica do
-- auto-incentivo de empate:
--   - toggle on/off em app_config (chave: auto_parcial)
--   - RPC `parcial_elegives_auto` retorna a fila com filtros "inteligentes":
--       * validados, com whatsapp, ja votaram, AINDA NAO receberam parcial
--       * ultimo voto >= N minutos atras (deixa o resultado se mexer antes)
--       * pelo menos 1 sub onde votou tem diff <= X% (vale a pena mandar)
--     O endpoint manual ja existente continua usando `elegiveis_parcial()`.
--
-- Roda no SQL Editor depois do deploy. Idempotente.
-- ==========================================================================

-- 1. Toggle padrao desligado — admin liga manualmente quando confortavel.
insert into app_config (chave, valor)
values ('auto_parcial', 'off')
on conflict (chave) do nothing;

-- 2. Fila pra cron.
-- p_min_minutos_apos_voto: ignora quem acabou de votar (default 60min).
-- p_max_diff_pct: pula quem so votou em subs decididas (default 30%, ou seja,
--   pelo menos 1 sub do votante precisa ter diff <= 30% pra valer a pena).
create or replace function parcial_elegives_auto(
  p_min_minutos_apos_voto int default 60,
  p_max_diff_pct int default 30
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
  with elegiveis_base as (
    select
      v.id            as votante_id,
      v.nome          as votante_nome,
      v.whatsapp      as whatsapp,
      max(vt.criado_em) as ultimo_voto_em
    from votantes v
    join votos vt on vt.votante_id = v.id
    where v.whatsapp_validado = true
      and v.whatsapp is not null
      and v.parcial_enviada_em is null
    group by v.id, v.nome, v.whatsapp
    having max(vt.criado_em) <= now() - (p_min_minutos_apos_voto || ' minutes')::interval
  ),
  -- Pra cada votante elegivel, calcula a menor diff% entre as subs onde votou.
  -- Aproveitando o motor do RPC parcial_subcats_votante (top 3 acirradas).
  diffs as (
    select
      eb.votante_id,
      min(p.diff_top12 * 100.0 / nullif(p.total_subcat, 0))::numeric as melhor_diff_pct
    from elegiveis_base eb
    cross join lateral parcial_subcats_votante(eb.votante_id) p
    where p.pos = 1
    group by eb.votante_id
  )
  select
    eb.votante_id,
    eb.votante_nome,
    eb.whatsapp,
    eb.ultimo_voto_em,
    coalesce(d.melhor_diff_pct, 100)::numeric as melhor_diff_pct
  from elegiveis_base eb
  left join diffs d on d.votante_id = eb.votante_id
  where coalesce(d.melhor_diff_pct, 100) <= p_max_diff_pct
  order by eb.ultimo_voto_em asc;  -- FIFO: quem votou primeiro recebe primeiro
$$;
