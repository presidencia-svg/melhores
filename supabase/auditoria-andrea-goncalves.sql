-- ==========================================================================
-- Auditoria: quem votou em Andrea Goncalves.
-- Roda no SQL Editor do Supabase.
-- Cada query mostra um angulo diferente — roda todas pra ter o quadro.
-- ==========================================================================

-- 1) Acha o(s) candidato(s) com esse nome (pra ver se tem mais de um)
select c.id, c.nome, s.nome as subcategoria, cat.nome as categoria,
       (select count(*) from votos v where v.candidato_id = c.id) as total_votos
from candidatos c
join subcategorias s on s.id = c.subcategoria_id
join categorias cat on cat.id = s.categoria_id
where c.nome ilike 'andrea%gon%alves%'
order by total_votos desc;


-- 2) Lista completa de votantes que votaram em Andrea — com sinais de auditoria
select
  v.criado_em                                  as votado_em,
  vt.nome                                      as votante,
  -- CPF mascarado (LGPD)
  '***.***.' || right(vt.cpf, 6)               as cpf_mask,
  vt.whatsapp,
  vt.whatsapp_validado,
  vt.spc_validado,
  vt.selfie_url is not null                    as tem_selfie,
  vt.ip,
  -- Primeiros 12 chars do fingerprint pra agrupamento visual
  left(coalesce(vt.device_fingerprint, ''), 12) as fp_prefix,
  vt.user_agent,
  s.nome                                       as subcategoria
from votos v
join candidatos c on c.id = v.candidato_id
join subcategorias s on s.id = c.subcategoria_id
join votantes vt on vt.id = v.votante_id
where c.nome ilike 'andrea%gon%alves%'
order by v.criado_em desc;


-- 3) AGRUPADO POR FINGERPRINT — flagra muitos CPFs no mesmo aparelho votando nela
select
  left(coalesce(vt.device_fingerprint, '(sem fp)'), 12) as fp_prefix,
  count(distinct vt.id)                                  as cpfs_distintos,
  array_agg(distinct vt.nome order by vt.nome)           as nomes,
  min(v.criado_em)                                       as primeiro_voto,
  max(v.criado_em)                                       as ultimo_voto
from votos v
join candidatos c on c.id = v.candidato_id
join votantes vt on vt.id = v.votante_id
where c.nome ilike 'andrea%gon%alves%'
group by fp_prefix
having count(distinct vt.id) > 1                         -- mais de 1 CPF no mesmo fp
order by cpfs_distintos desc;


-- 4) AGRUPADO POR IP — flagra rajadas do mesmo IP
select
  vt.ip,
  count(distinct vt.id)                          as cpfs_distintos,
  array_agg(distinct vt.nome order by vt.nome)   as nomes,
  min(v.criado_em)                               as primeiro_voto,
  max(v.criado_em)                               as ultimo_voto,
  extract(epoch from (max(v.criado_em) - min(v.criado_em))) / 60 as janela_minutos
from votos v
join candidatos c on c.id = v.candidato_id
join votantes vt on vt.id = v.votante_id
where c.nome ilike 'andrea%gon%alves%'
group by vt.ip
having count(distinct vt.id) > 2                 -- 3+ votos do mesmo IP
order by cpfs_distintos desc;


-- 5) DISTRIBUIÇÃO TEMPORAL — quando os votos chegaram (rajadas suspeitas)
select
  date_trunc('hour', v.criado_em at time zone 'America/Sao_Paulo') as hora_local,
  count(*)                                                          as votos,
  count(distinct vt.ip)                                             as ips,
  count(distinct vt.device_fingerprint)                             as fps
from votos v
join candidatos c on c.id = v.candidato_id
join votantes vt on vt.id = v.votante_id
where c.nome ilike 'andrea%gon%alves%'
group by hora_local
order by hora_local desc;


-- 6) RESUMO ANTI-FRAUDE
with votos_andrea as (
  select v.id, vt.id as votante_id, vt.spc_validado, vt.whatsapp_validado,
         vt.selfie_url, vt.device_fingerprint, vt.ip
  from votos v
  join candidatos c on c.id = v.candidato_id
  join votantes vt on vt.id = v.votante_id
  where c.nome ilike 'andrea%gon%alves%'
)
select
  count(*)                                          as total_votos,
  count(*) filter (where spc_validado)              as spc_validado,
  count(*) filter (where whatsapp_validado)         as whatsapp_validado,
  count(*) filter (where selfie_url is null)        as sem_selfie,
  count(distinct device_fingerprint)                as fps_unicos,
  count(distinct ip)                                as ips_unicos,
  round(100.0 * count(*) filter (where spc_validado) / count(*), 1)        as pct_spc,
  round(100.0 * count(*) filter (where whatsapp_validado) / count(*), 1)   as pct_whatsapp
from votos_andrea;
