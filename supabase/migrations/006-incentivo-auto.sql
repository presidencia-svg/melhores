-- ==========================================================================
-- Disparo automatico de incentivo quando ha empate (top1 = top2 em votos).
--
-- 1. Tabela `app_config` — flags simples de configuracao (toggle on/off).
-- 2. Tabela `incentivo_envios_log` — registro de cada envio (manual + auto).
--    Usada pra cap global por hora/dia (votantes.incentivo_enviado_em so
--    guarda o ULTIMO envio).
-- 3. Funcao `incentivo_elegives_empate(p_cooldown_horas)` — retorna votantes
--    de AMBOS os lados de empates (diff = 0), respeitando cooldown.
-- ==========================================================================

create table if not exists app_config (
  chave text primary key,
  valor text not null,
  atualizado_em timestamptz not null default now()
);

insert into app_config (chave, valor) values
  ('auto_incentivo_empate', 'on')
on conflict (chave) do nothing;

create table if not exists incentivo_envios_log (
  id uuid primary key default gen_random_uuid(),
  votante_id uuid not null references votantes(id) on delete cascade,
  subcategoria_id uuid references subcategorias(id) on delete set null,
  motivo text not null check (motivo in ('manual','auto_empate')),
  canal text check (canal in ('meta','zapi','sms')),
  criado_em timestamptz not null default now()
);

create index if not exists idx_incentivo_envios_criado_em
  on incentivo_envios_log(criado_em desc);
create index if not exists idx_incentivo_envios_votante
  on incentivo_envios_log(votante_id);

-- Votantes elegives para o disparo automatico de empate.
-- Diferente da funcao manual: pega AMBOS os lados (top1 + top2 quando empate)
-- e usa cooldown em horas em vez de "nunca recebeu".
create or replace function incentivo_elegives_empate(
  p_cooldown_horas int default 48,
  p_min_minutos_apos_voto int default 30
)
returns table (
  votante_id uuid,
  votante_nome text,
  whatsapp text,
  categoria_nome text,
  subcategoria_id uuid,
  subcategoria_nome text,
  candidato_perdendo_id uuid,
  candidato_perdendo_nome text,
  candidato_perdendo_votos bigint,
  candidato_lider_nome text,
  candidato_lider_votos bigint,
  diferenca bigint
)
language sql stable as $$
  with ranked as (
    select
      c.id as candidato_id,
      c.nome as candidato_nome,
      c.subcategoria_id,
      s.nome as subcategoria_nome,
      cat.nome as categoria_nome,
      count(v.id) as votos,
      row_number() over (
        partition by c.subcategoria_id
        order by count(v.id) desc, c.nome
      ) as rk
    from candidatos c
    join subcategorias s on s.id = c.subcategoria_id
    join categorias cat on cat.id = s.categoria_id
    left join votos v on v.candidato_id = c.id
    where c.status = 'aprovado'
    group by c.id, s.id, cat.id
  ),
  empates as (
    -- top1 + top2 com mesma contagem de votos (empate puro).
    select
      t1.subcategoria_id,
      t1.subcategoria_nome,
      t1.categoria_nome,
      t1.candidato_id as top1_id,
      t1.candidato_nome as top1_nome,
      t1.votos as top1_votos,
      t2.candidato_id as top2_id,
      t2.candidato_nome as top2_nome,
      t2.votos as top2_votos
    from ranked t1
    join ranked t2
      on t2.subcategoria_id = t1.subcategoria_id
     and t2.rk = 2
    where t1.rk = 1
      and t1.votos = t2.votos
      and t1.votos > 0
  ),
  -- Para cada empate, gera 2 linhas (uma pra cada lado), com perdendo/lider
  -- "espelhados" — o votante recebe a info do candidato no qual votou.
  alvos as (
    select
      e.subcategoria_id,
      e.subcategoria_nome,
      e.categoria_nome,
      e.top1_id as candidato_perdendo_id,
      e.top1_nome as candidato_perdendo_nome,
      e.top1_votos as candidato_perdendo_votos,
      e.top2_nome as candidato_lider_nome,
      e.top2_votos as candidato_lider_votos
    from empates e
    union all
    select
      e.subcategoria_id,
      e.subcategoria_nome,
      e.categoria_nome,
      e.top2_id,
      e.top2_nome,
      e.top2_votos,
      e.top1_nome,
      e.top1_votos
    from empates e
  )
  select
    vt.id,
    vt.nome,
    vt.whatsapp,
    a.categoria_nome,
    a.subcategoria_id,
    a.subcategoria_nome,
    a.candidato_perdendo_id,
    a.candidato_perdendo_nome,
    a.candidato_perdendo_votos,
    a.candidato_lider_nome,
    a.candidato_lider_votos,
    (a.candidato_perdendo_votos - a.candidato_lider_votos) as diferenca
  from alvos a
  join votos v on v.candidato_id = a.candidato_perdendo_id
  join votantes vt on vt.id = v.votante_id
  where vt.whatsapp_validado = true
    and vt.whatsapp is not null
    and (
      vt.incentivo_enviado_em is null
      or vt.incentivo_enviado_em < now() - (p_cooldown_horas || ' hours')::interval
    )
    and not exists (
      select 1 from votos v2
      where v2.votante_id = vt.id
        and v2.criado_em > now() - (p_min_minutos_apos_voto || ' minutes')::interval
    )
  order by a.subcategoria_nome, vt.nome;
$$;
