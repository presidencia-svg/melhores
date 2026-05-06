-- ==========================================================================
-- 036-views-edicao-id.sql (v2 — drop cascade pra evitar column rename error)
--
-- Atualiza views/RPCs pra projetar/aceitar edicao_id, fechando o ultimo
-- vetor de vazamento entre tenants. Antes:
--   - v_resultados, v_podium, v_duelos, v_top6_por_sub etc agregavam
--     candidatos/votos sem distincao de edicao → mistura de tenants.
--   - v_numeros_campanha hardcodava "edicao ativa" via subselect global.
--   - votantes_listagem RPC retornava todos os votantes do banco.
--
-- Como Postgres nao permite renomear/reordenar colunas em CREATE OR REPLACE
-- VIEW, fazemos DROP CASCADE primeiro (derruba dependentes) e recriamos
-- tudo em ordem de dependencia.
--
-- DEPENDE de migration 035 (denorm edicao_id em votos/candidatos/subcat).
-- ==========================================================================

begin;
set local statement_timeout = '10min';

-- ==========================================================================
-- 1. Drop em ordem (cascade onde tem dependencia conhecida).
-- ==========================================================================

-- materialized view depende de v_resultados — explicitar pra cascata pegar.
drop materialized view if exists v_resultados_riscado;

-- v_resultados e' raiz: cascade derruba v_duelos, v_podium, v_top6_por_sub,
-- v_top_candidatos, v_resultados_por_categoria, v_subcats_acirradas e
-- qualquer outra view dependente.
drop view if exists v_resultados cascade;

-- Views standalone (sem dependentes a recriar):
drop view if exists v_votos_por_dia cascade;
drop view if exists v_otp_por_dia cascade;
drop view if exists v_resumo_hoje cascade;
drop view if exists v_votos_por_hora_hoje cascade;
drop view if exists v_fingerprints_compartilhados cascade;
drop view if exists v_incentivo_stats cascade;
drop view if exists v_parcial_stats cascade;
drop view if exists v_numeros_campanha cascade;

-- Funcoes — assinaturas vao mudar.
drop function if exists votantes_listagem(int, int);

-- ==========================================================================
-- 2. v_resultados — raiz. Projeta edicao_id pra todos os derivativos.
-- ==========================================================================

create view v_resultados as
select
  c.edicao_id,
  c.id as candidato_id,
  c.nome as candidato_nome,
  c.foto_url,
  c.origem,
  s.id as subcategoria_id,
  s.nome as subcategoria_nome,
  cat.id as categoria_id,
  cat.nome as categoria_nome,
  count(v.id) as total_votos
from candidatos c
join subcategorias s on s.id = c.subcategoria_id
join categorias cat on cat.id = s.categoria_id
left join votos v on v.candidato_id = c.id
where c.status = 'aprovado'
group by c.edicao_id, c.id, s.id, cat.id
order by cat.ordem, s.ordem, total_votos desc, c.nome;

-- ==========================================================================
-- 3. Derivados de v_resultados.
-- ==========================================================================

create view v_duelos as
with ranked as (
  select
    r.edicao_id,
    r.subcategoria_id,
    r.subcategoria_nome,
    r.candidato_id,
    r.candidato_nome,
    r.foto_url,
    r.total_votos,
    row_number() over (
      partition by r.subcategoria_id
      order by r.total_votos desc, r.candidato_nome
    ) as pos
  from v_resultados r
)
select
  r1.edicao_id,
  r1.subcategoria_id,
  r1.subcategoria_nome,
  r1.candidato_id   as top1_id,
  r1.candidato_nome as top1_nome,
  r1.foto_url       as top1_foto,
  r1.total_votos::bigint as top1_votos,
  r2.candidato_id   as top2_id,
  r2.candidato_nome as top2_nome,
  r2.foto_url       as top2_foto,
  r2.total_votos::bigint as top2_votos,
  (r1.total_votos + r2.total_votos)::bigint as total_votos,
  (r1.total_votos - r2.total_votos)::bigint as diff,
  case
    when (r1.total_votos + r2.total_votos) > 0
    then round((r1.total_votos - r2.total_votos)::numeric * 100
                / (r1.total_votos + r2.total_votos), 1)
    else 0
  end as diff_pct
from ranked r1
join ranked r2 using (subcategoria_id)
where r1.pos = 1
  and r2.pos = 2
  and r1.total_votos > 0;

create view v_podium as
with ranked as (
  select
    r.edicao_id,
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
)
select
  r1.edicao_id,
  r1.subcategoria_id,
  r1.subcategoria_nome,
  r1.total_subcat,
  r1.candidato_id   as top1_id,
  r1.candidato_nome as top1_nome,
  r1.foto_url       as top1_foto,
  r1.total_votos::bigint as top1_votos,
  r2.candidato_id   as top2_id,
  r2.candidato_nome as top2_nome,
  r2.foto_url       as top2_foto,
  coalesce(r2.total_votos, 0)::bigint as top2_votos,
  r3.candidato_id   as top3_id,
  r3.candidato_nome as top3_nome,
  r3.foto_url       as top3_foto,
  coalesce(r3.total_votos, 0)::bigint as top3_votos
from ranked r1
left join ranked r2 on r2.subcategoria_id = r1.subcategoria_id and r2.pos = 2
left join ranked r3 on r3.subcategoria_id = r1.subcategoria_id and r3.pos = 3
where r1.pos = 1
  and r1.total_votos > 0;

create view v_top6_por_sub as
with ranked as (
  select
    r.edicao_id,
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

create view v_top_candidatos as
select *
from v_resultados
order by total_votos desc
limit 50;

create view v_resultados_por_categoria as
select
  edicao_id,
  categoria_id,
  categoria_nome,
  sum(total_votos)::bigint as total_votos
from v_resultados
group by edicao_id, categoria_id, categoria_nome
order by total_votos desc;

create view v_subcats_acirradas as
with ranked as (
  select
    edicao_id,
    subcategoria_id,
    subcategoria_nome,
    candidato_nome,
    total_votos,
    row_number() over (
      partition by subcategoria_id order by total_votos desc
    ) as posicao
  from v_resultados
)
select
  r1.edicao_id,
  r1.subcategoria_id,
  r1.subcategoria_nome,
  r1.candidato_nome as primeiro_nome,
  r1.total_votos   as primeiro_votos,
  r2.candidato_nome as segundo_nome,
  r2.total_votos   as segundo_votos,
  (r1.total_votos - r2.total_votos) as diff
from ranked r1
join ranked r2 using (subcategoria_id)
where r1.posicao = 1
  and r2.posicao = 2
  and r1.total_votos > 0
order by diff asc, r1.subcategoria_nome asc
limit 10;

-- ==========================================================================
-- 4. Views standalone (de tabelas-base).
-- ==========================================================================

create view v_votos_por_dia as
select
  edicao_id,
  (criado_em at time zone 'America/Sao_Paulo')::date as dia,
  count(*) as total
from votos
where criado_em >= (now() - interval '90 days')
group by edicao_id, (criado_em at time zone 'America/Sao_Paulo')::date
order by (criado_em at time zone 'America/Sao_Paulo')::date;

create view v_otp_por_dia as
select
  vt.edicao_id,
  (w.criado_em at time zone 'America/Sao_Paulo')::date as dia,
  count(*) as total
from whatsapp_codigos w
join votantes vt on vt.id = w.votante_id
where w.criado_em >= (now() - interval '90 days')
group by vt.edicao_id, (w.criado_em at time zone 'America/Sao_Paulo')::date
order by (w.criado_em at time zone 'America/Sao_Paulo')::date;

create view v_votos_por_hora_hoje as
select
  edicao_id,
  extract(hour from (criado_em at time zone 'America/Sao_Paulo'))::int as hora,
  count(*)::int as total
from votos
where (criado_em at time zone 'America/Sao_Paulo')::date
    = (now() at time zone 'America/Sao_Paulo')::date
group by edicao_id, extract(hour from (criado_em at time zone 'America/Sao_Paulo'))
order by extract(hour from (criado_em at time zone 'America/Sao_Paulo'));

create view v_fingerprints_compartilhados as
select
  edicao_id,
  device_fingerprint,
  count(*)::int as total
from votantes
where device_fingerprint is not null
group by edicao_id, device_fingerprint
having count(*) > 1;

create view v_resumo_hoje as
with hoje as (
  select (now() at time zone 'America/Sao_Paulo')::date as d
)
select
  e.id as edicao_id,
  (select count(*) from votos
    where edicao_id = e.id
      and (criado_em at time zone 'America/Sao_Paulo')::date = (select d from hoje))::int as votos,
  (select count(*) from votantes
    where edicao_id = e.id
      and (criado_em at time zone 'America/Sao_Paulo')::date = (select d from hoje))::int as votantes,
  (select count(*) from whatsapp_codigos w
    join votantes vt on vt.id = w.votante_id
    where vt.edicao_id = e.id
      and (w.criado_em at time zone 'America/Sao_Paulo')::date = (select d from hoje))::int as otps,
  (select count(*) from votantes
    where edicao_id = e.id
      and parcial_enviada_em is not null
      and (parcial_enviada_em at time zone 'America/Sao_Paulo')::date = (select d from hoje))::int as parciais
from edicao e;

create view v_incentivo_stats as
select
  edicao_id,
  count(*) filter (where incentivo_enviado_em is not null)::int as ja_receberam,
  count(*) filter (
    where incentivo_enviado_em is not null
      and (incentivo_enviado_em at time zone 'America/Sao_Paulo')::date
        = (now() at time zone 'America/Sao_Paulo')::date
  )::int as enviadas_hoje,
  max(incentivo_enviado_em)::timestamptz as ultima_enviada
from votantes
group by edicao_id;

create view v_parcial_stats as
with base as (
  select v.edicao_id, v.id, v.parcial_enviada_em
  from votantes v
  where v.whatsapp_validado = true
    and v.whatsapp is not null
    and exists (select 1 from votos where votante_id = v.id)
)
select
  edicao_id,
  count(*)::int                                                            as total,
  count(*) filter (where parcial_enviada_em is not null)::int              as ja_receberam,
  count(*) filter (where parcial_enviada_em is null)::int                  as na_fila,
  count(*) filter (
    where parcial_enviada_em is not null
      and (parcial_enviada_em at time zone 'America/Sao_Paulo')::date
        = (now() at time zone 'America/Sao_Paulo')::date
  )::int                                                                   as enviadas_hoje,
  max(parcial_enviada_em)::timestamptz                                     as ultima_enviada
from base
group by edicao_id;

-- ==========================================================================
-- 5. v_resultados_riscado — MATERIALIZED, herda edicao_id de v_resultados.
-- ==========================================================================

create materialized view v_resultados_riscado as
with fps_compartilhados as (
  select device_fingerprint
  from votantes
  where device_fingerprint is not null
  group by device_fingerprint
  having count(*) >= 2
),
ips_compartilhados as (
  select ip from votantes where ip is not null group by ip having count(*) >= 5
),
risco_por_cand as (
  select
    v.candidato_id,
    round(100.0 * count(*) filter (where vt.spc_validado) / nullif(count(*), 0), 1)         as pct_spc,
    round(100.0 * count(*) filter (where vt.whatsapp_validado) / nullif(count(*), 0), 1)    as pct_wa,
    round(100.0 * count(*) filter (where vt.selfie_url is not null) / nullif(count(*), 0), 1) as pct_selfie,
    round(100.0 * count(*) filter (
      where vt.device_fingerprint in (select device_fingerprint from fps_compartilhados)
    ) / nullif(count(*), 0), 1)                                                              as pct_fp_comp,
    round(100.0 * count(*) filter (
      where vt.ip in (select ip from ips_compartilhados)
    ) / nullif(count(*), 0), 1)                                                              as pct_ip_comp,
    round(
        0.25 * (100 - 100.0 * count(*) filter (where vt.spc_validado) / nullif(count(*), 0))
      + 0.15 * (100 - 100.0 * count(*) filter (where vt.whatsapp_validado) / nullif(count(*), 0))
      + 0.10 * (100 - 100.0 * count(*) filter (where vt.selfie_url is not null) / nullif(count(*), 0))
      + 0.30 * (100.0 * count(*) filter (where vt.device_fingerprint in (select device_fingerprint from fps_compartilhados)) / nullif(count(*), 0))
      + 0.20 * (100.0 * count(*) filter (where vt.ip in (select ip from ips_compartilhados)) / nullif(count(*), 0))
    , 1)                                                                                     as score_risco
  from votos v
  join votantes vt on vt.id = v.votante_id
  group by v.candidato_id
)
select
  r.*,
  rc.pct_spc,
  rc.pct_wa,
  rc.pct_selfie,
  rc.pct_fp_comp,
  rc.pct_ip_comp,
  coalesce(rc.score_risco, 0)::numeric as score_risco
from v_resultados r
left join risco_por_cand rc on rc.candidato_id = r.candidato_id;

create unique index if not exists v_resultados_riscado_pk
  on v_resultados_riscado (candidato_id);
create index if not exists v_resultados_riscado_score_idx
  on v_resultados_riscado (score_risco desc);
create index if not exists v_resultados_riscado_sub_idx
  on v_resultados_riscado (subcategoria_id);
create index if not exists v_resultados_riscado_edicao_idx
  on v_resultados_riscado (edicao_id);

commit;

-- ==========================================================================
-- 6. RPCs (fora do bloco transacional pra evitar lock excessivo).
-- ==========================================================================

create or replace function numeros_campanha(p_edicao_id uuid)
returns table (
  votantes_unicos int,
  votos_validos int,
  subcategorias_ativas int,
  candidatos_elegiveis int,
  com_spc_validado int,
  com_whatsapp_validado int,
  com_selfie int,
  ips_distintos int,
  dispositivos_distintos int,
  tentativas_identificacao int,
  otps_nao_validados int,
  dispositivos_compartilhados int,
  votos_dia_pico int,
  data_dia_pico text
)
language sql
stable
as $$
  select
    (select count(*) from votantes where edicao_id = p_edicao_id)::int                              as votantes_unicos,
    (select count(*) from votos where edicao_id = p_edicao_id)::int                                  as votos_validos,
    (select count(*) from subcategorias s
       join categorias c on c.id = s.categoria_id
       where s.edicao_id = p_edicao_id and s.ativa and c.ativa)::int                                  as subcategorias_ativas,
    (select count(*) from candidatos
       where edicao_id = p_edicao_id and status = 'aprovado')::int                                    as candidatos_elegiveis,

    (select count(*) from votantes where edicao_id = p_edicao_id and spc_validado)::int              as com_spc_validado,
    (select count(*) from votantes where edicao_id = p_edicao_id and whatsapp_validado)::int         as com_whatsapp_validado,
    (select count(*) from votantes where edicao_id = p_edicao_id and selfie_url is not null)::int    as com_selfie,

    (select count(distinct ip) from votantes where edicao_id = p_edicao_id)::int                     as ips_distintos,
    (select count(distinct device_fingerprint) from votantes
       where edicao_id = p_edicao_id and device_fingerprint is not null)::int                        as dispositivos_distintos,

    -- tentativas_identificacao e otps_nao_validados sao globais (rate_limit_ip
    -- e whatsapp_codigos nao tem edicao_id direto). Em multi-tenant
    -- agregam todos os tenants — TODO refinar com JOIN se virar problema.
    (select count(*) from rate_limit_ip where acao = 'identificar')::int                              as tentativas_identificacao,
    (select count(*) from whatsapp_codigos w
       join votantes vt on vt.id = w.votante_id
       where vt.edicao_id = p_edicao_id and not w.validado)::int                                      as otps_nao_validados,
    (select count(*) from v_fingerprints_compartilhados
       where edicao_id = p_edicao_id and total >= 2)::int                                             as dispositivos_compartilhados,

    (select count(*) from votos
       where edicao_id = p_edicao_id
         and (criado_em at time zone 'America/Sao_Paulo')::date = (
           select (criado_em at time zone 'America/Sao_Paulo')::date
           from votos
           where edicao_id = p_edicao_id
           group by (criado_em at time zone 'America/Sao_Paulo')::date
           order by count(*) desc limit 1
         ))::int                                                                                      as votos_dia_pico,
    (select to_char((criado_em at time zone 'America/Sao_Paulo')::date, 'DD/MM/YYYY')
       from votos
       where edicao_id = p_edicao_id
       group by (criado_em at time zone 'America/Sao_Paulo')::date
       order by count(*) desc limit 1)                                                                as data_dia_pico
$$;

create or replace function votantes_listagem(
  p_edicao_id uuid,
  p_offset int,
  p_limit int
)
returns table (
  id uuid,
  cpf text,
  nome text,
  selfie_url text,
  ip text,
  user_agent text,
  device_fingerprint text,
  whatsapp text,
  whatsapp_validado boolean,
  criado_em timestamptz,
  votos_count bigint,
  total_count bigint
)
language sql
stable
as $$
  select
    v.id, v.cpf, v.nome, v.selfie_url, v.ip, v.user_agent,
    v.device_fingerprint, v.whatsapp, v.whatsapp_validado, v.criado_em,
    coalesce((select count(*) from votos where votante_id = v.id), 0)::bigint as votos_count,
    (select count(*) from votantes where edicao_id = p_edicao_id)::bigint as total_count
  from votantes v
  where v.edicao_id = p_edicao_id
  order by v.criado_em desc
  offset p_offset
  limit p_limit;
$$;
