-- ==========================================================================
-- 023-podium-scorerisco.sql
--
-- View v_podium_riscado: tudo do v_podium + score_risco do top1 (0-100).
-- Score combina 5 sinais ponderados:
--   25% — % SEM SPC validado
--   15% — % SEM WhatsApp validado
--   10% — % SEM selfie
--   30% — % vindos de aparelho com 2+ CPFs (fp compartilhado)
--   20% — % vindos de IP com 5+ votantes (ip compartilhado)
--
-- Quanto maior, mais merece olhar. Nao prova fraude — e' so um indicador
-- pra priorizar auditoria. Casos onde o kill-switch SPC/WA estava off na
-- janela de cadastro inflam o score sem indicar drible real.
--
-- Roda no SQL Editor do Supabase. Idempotente.
-- ==========================================================================

create or replace view v_podium_riscado as
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
risco_top1 as (
  select
    p.subcategoria_id,
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
  from v_podium p
  join votos v on v.candidato_id = p.top1_id
  join votantes vt on vt.id = v.votante_id
  group by p.subcategoria_id
)
select
  p.*,
  r.pct_spc,
  r.pct_wa,
  r.pct_selfie,
  r.pct_fp_comp,
  r.pct_ip_comp,
  coalesce(r.score_risco, 0)::numeric as score_risco
from v_podium p
left join risco_top1 r on r.subcategoria_id = p.subcategoria_id;
