-- ==========================================================================
-- 024-resultados-scorerisco.sql (v2 — MATERIALIZED)
--
-- A versao 1 era VIEW comum, mas o calculo do score (subqueries por
-- candidato + joins com fps/ips compartilhados) explodia com 9k+ candidatos
-- e estourava statement_timeout do Supabase.
--
-- Solucao: MATERIALIZED VIEW. Calcula 1 vez (no CREATE), guarda no disco,
-- SELECT depois e' instantaneo. Refresh manual via funcao refresh_resultados_riscado()
-- quando precisar (ex: depois de mesclar candidatos).
--
-- Roda no SQL Editor do Supabase. O CREATE pode levar 2-5 min — por isso o
-- SET LOCAL statement_timeout pra evitar timeout.
-- ==========================================================================

begin;

set local statement_timeout = '10min';

-- Garante que comece limpo (caso a v1 tenha sido criada como view)
drop view if exists v_resultados_riscado;
drop materialized view if exists v_resultados_riscado;

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

-- Indice unico em candidato_id permite REFRESH CONCURRENTLY (sem trancar leitura)
create unique index if not exists v_resultados_riscado_pk
  on v_resultados_riscado (candidato_id);

-- Indices auxiliares pra ordenacao por risco e por sub
create index if not exists v_resultados_riscado_score_idx
  on v_resultados_riscado (score_risco desc);
create index if not exists v_resultados_riscado_sub_idx
  on v_resultados_riscado (subcategoria_id);

commit;


-- ==========================================================================
-- Funcao pra atualizar a view manualmente (apos mesclagens, por ex).
-- Chamar com: select refresh_resultados_riscado();
-- ==========================================================================
create or replace function refresh_resultados_riscado()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently v_resultados_riscado;
end;
$$;
