-- ==========================================================================
-- Auditoria pós-eleição — visão geral + drill-down por candidato.
-- Roda no SQL Editor do Supabase. Cada secao e' independente.
-- ==========================================================================
-- Ordem sugerida:
--   PARTE 1 — Visao macro do sistema (numeros agregados).
--   PARTE 2 — Aparelhos/IPs com muitos votantes (sinais brutos).
--   PARTE 3 — Picos temporais (rajadas).
--   PARTE 4 — Scorecard por top-1 do podio (qual vencedor merece olhar).
--   PARTE 5 — Drill-down num candidato especifico (substitui o WHERE).
-- ==========================================================================


-- ==========================================================================
-- PARTE 1 — VISAO MACRO
-- "Como o sistema se comportou no agregado."
-- ==========================================================================

-- 1.1) Numeros gerais da edicao ativa
with e as (select id from edicao where ativa = true limit 1)
select
  (select count(*) from votantes where edicao_id = (select id from e))                              as votantes,
  (select count(*) from votos v join votantes vt on vt.id = v.votante_id where vt.edicao_id = (select id from e)) as votos,
  (select count(*) from votantes where edicao_id = (select id from e) and spc_validado)             as com_spc,
  (select count(*) from votantes where edicao_id = (select id from e) and whatsapp_validado)        as com_wa,
  (select count(*) from votantes where edicao_id = (select id from e) and selfie_url is not null)   as com_selfie,
  (select count(distinct ip) from votantes where edicao_id = (select id from e))                    as ips_distintos,
  (select count(distinct device_fingerprint) from votantes
     where edicao_id = (select id from e) and device_fingerprint is not null)                       as fps_distintos;


-- ==========================================================================
-- PARTE 2 — APARELHOS / IPs COM MUITOS VOTANTES
-- "Onde estao as concentracoes." Sem julgamento ainda — so dados.
-- ==========================================================================

-- 2.1) Top 30 fingerprints com mais CPFs (devices compartilhados)
-- Limite legitimo do sistema e' 2/device. Acima disso = bug ou drible.
select
  left(device_fingerprint, 12)                       as fp_prefix,
  count(*)                                           as cpfs,
  array_agg(nome order by criado_em)                 as nomes,
  min(criado_em)                                     as primeiro,
  max(criado_em)                                     as ultimo
from votantes
where device_fingerprint is not null
group by device_fingerprint
having count(*) >= 2
order by cpfs desc, ultimo desc
limit 30;


-- 2.2) Top 30 IPs com mais votantes distintos
-- Atencao: IP compartilhado pode ser legitimo (escritorio, Wi-Fi publico).
-- Olhar combinado com janela temporal apertada (rajada).
select
  ip,
  count(*)                                           as cpfs,
  count(*) filter (where spc_validado)               as com_spc,
  count(*) filter (where whatsapp_validado)          as com_wa,
  array_agg(nome order by criado_em)                 as nomes,
  min(criado_em)                                     as primeiro,
  max(criado_em)                                     as ultimo,
  round(extract(epoch from (max(criado_em) - min(criado_em))) / 60, 1) as janela_min
from votantes
where ip is not null
group by ip
having count(*) >= 5
order by cpfs desc, janela_min asc
limit 30;


-- 2.3) Cadastros em rajada do mesmo IP (mais critico)
-- 5+ cadastros do mesmo IP em menos de 30 min.
with com_janela as (
  select
    ip,
    count(*)                                                                       as cadastros,
    extract(epoch from (max(criado_em) - min(criado_em))) / 60                     as janela_min,
    array_agg(nome order by criado_em)                                             as nomes,
    array_agg(left(coalesce(device_fingerprint, '?'), 12) order by criado_em)      as fps
  from votantes
  where ip is not null
  group by ip
)
select *
from com_janela
where cadastros >= 5 and janela_min <= 30
order by cadastros desc, janela_min asc;


-- ==========================================================================
-- PARTE 3 — PICOS TEMPORAIS
-- "Quando aconteceu algo fora do normal."
-- ==========================================================================

-- 3.1) Janelas de 5 min com mais de 200 votos (ajuste o limiar conforme escala)
select
  date_trunc('hour', v.criado_em at time zone 'America/Sao_Paulo')
    + (floor(extract(minute from (v.criado_em at time zone 'America/Sao_Paulo')) / 5) * interval '5 min') as bucket_5min,
  count(*)                                           as votos,
  count(distinct vt.ip)                              as ips,
  count(distinct vt.device_fingerprint)              as fps,
  round(100.0 * count(*)::numeric / nullif(count(distinct vt.ip), 0), 1) as votos_por_ip
from votos v
join votantes vt on vt.id = v.votante_id
group by bucket_5min
having count(*) >= 200
order by votos desc
limit 30;


-- ==========================================================================
-- PARTE 4 — SCORECARD POR TOP-1 DO PODIO
-- "Qual vencedor tem mais sinais amarelos no perfil dos votos."
--
-- Retorna o top1 de cada subcategoria com:
--   - total de votos
--   - % com SPC, % com WhatsApp, % com selfie
--   - % de votos vindos de FP que tem 2+ CPFs (suspeito)
--   - % de votos vindos de IP que tem 5+ CPFs (suspeito)
--   - score_risco (0-100, soma ponderada — quanto maior, mais merece olhar)
-- ==========================================================================

with top1 as (
  select subcategoria_id, top1_id as candidato_id, top1_nome as nome,
         subcategoria_nome, total_subcat as total_votos
  from v_podium
),
votos_top1 as (
  select t.candidato_id, t.nome, t.subcategoria_nome, vt.id as votante_id,
         vt.spc_validado, vt.whatsapp_validado, vt.selfie_url,
         vt.device_fingerprint, vt.ip
  from top1 t
  join votos v on v.candidato_id = t.candidato_id
  join votantes vt on vt.id = v.votante_id
),
fps_compartilhados as (
  select device_fingerprint
  from votantes
  where device_fingerprint is not null
  group by device_fingerprint
  having count(*) >= 2
),
ips_compartilhados as (
  select ip from votantes where ip is not null group by ip having count(*) >= 5
)
select
  vt.nome                                            as candidato,
  vt.subcategoria_nome                               as subcategoria,
  count(*)                                           as votos,
  round(100.0 * count(*) filter (where spc_validado) / count(*), 1)         as pct_spc,
  round(100.0 * count(*) filter (where whatsapp_validado) / count(*), 1)    as pct_wa,
  round(100.0 * count(*) filter (where selfie_url is not null) / count(*), 1) as pct_selfie,
  round(100.0 * count(*) filter (
    where device_fingerprint in (select device_fingerprint from fps_compartilhados)
  ) / count(*), 1)                                   as pct_fp_compartilhado,
  round(100.0 * count(*) filter (
    where ip in (select ip from ips_compartilhados)
  ) / count(*), 1)                                   as pct_ip_compartilhado,
  -- score_risco: penaliza falta de SPC/WA/selfie e bonus pra FP/IP compartilhado
  round(
      0.25 * (100 - 100.0 * count(*) filter (where spc_validado) / count(*))
    + 0.15 * (100 - 100.0 * count(*) filter (where whatsapp_validado) / count(*))
    + 0.10 * (100 - 100.0 * count(*) filter (where selfie_url is not null) / count(*))
    + 0.30 * (100.0 * count(*) filter (where device_fingerprint in (select device_fingerprint from fps_compartilhados)) / count(*))
    + 0.20 * (100.0 * count(*) filter (where ip in (select ip from ips_compartilhados)) / count(*))
  , 1)                                               as score_risco
from votos_top1 vt
group by vt.candidato_id, vt.nome, vt.subcategoria_nome
order by score_risco desc, votos desc;


-- ==========================================================================
-- PARTE 5 — DRILL-DOWN NUM CANDIDATO
-- Troca o nome no WHERE e roda. Usa pra olhar caso a caso quem aparece
-- amarelo na PARTE 4.
-- ==========================================================================

-- COLE AQUI O NOME (substitui o trecho entre aspas)
-- Exemplo: 'tratto%car%' ou 'felipe%aranha%'
\set candidato_pattern '%TROCA AQUI%'

-- 5.1) Lista de votantes do candidato com sinais
select
  v.criado_em                                          as votado_em,
  vt.nome                                              as votante,
  '***.***.' || right(vt.cpf, 6)                       as cpf_mask,
  vt.spc_validado,
  vt.whatsapp_validado,
  vt.selfie_url is not null                            as tem_selfie,
  vt.ip,
  left(coalesce(vt.device_fingerprint, ''), 12)        as fp_prefix
from votos v
join candidatos c on c.id = v.candidato_id
join votantes vt on vt.id = v.votante_id
where c.nome ilike :'candidato_pattern'
order by v.criado_em desc;

-- 5.2) Resumo numerico (mesma logica do andrea original, parametrizado)
with votos_cand as (
  select vt.id as votante_id, vt.spc_validado, vt.whatsapp_validado,
         vt.selfie_url, vt.device_fingerprint, vt.ip
  from votos v
  join candidatos c on c.id = v.candidato_id
  join votantes vt on vt.id = v.votante_id
  where c.nome ilike :'candidato_pattern'
)
select
  count(*)                                                                    as total_votos,
  count(*) filter (where spc_validado)                                        as com_spc,
  count(*) filter (where whatsapp_validado)                                   as com_wa,
  count(*) filter (where selfie_url is null)                                  as sem_selfie,
  count(distinct device_fingerprint)                                          as fps_unicos,
  count(distinct ip)                                                          as ips_unicos,
  round(100.0 * count(*) filter (where spc_validado) / count(*), 1)           as pct_spc,
  round(100.0 * count(*) filter (where whatsapp_validado) / count(*), 1)      as pct_wa
from votos_cand;
