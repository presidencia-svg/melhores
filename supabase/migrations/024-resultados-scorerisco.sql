-- ==========================================================================
-- 024-resultados-scorerisco.sql
--
-- View v_resultados_riscado: tudo do v_resultados (todos candidatos, nao
-- so top1) + score_risco do CANDIDATO. Permite comparar 1o vs 2o vs 3o
-- na mesma sub — se o vencedor tem risco BEM MAIOR que os perseguidores,
-- e' sinal pra investigar.
--
-- Mesma logica da v_podium_riscado (migration 023), so muda o granular:
-- la era top1 por sub, aqui e' por candidato individual.
--
-- Roda no SQL Editor do Supabase. Idempotente.
-- ==========================================================================

create or replace view v_resultados_riscado as
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
