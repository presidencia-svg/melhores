-- ==========================================================================
-- 030-view-numeros-campanha.sql
--
-- View pra a secao "Numeros da campanha" da pagina /admin/imprensa.
-- Retorna 1 linha com varias contagens uteis pra release de transparencia
-- pra imprensa: volumes, % de validacoes anti-fraude, sinais agregados.
--
-- Roda no SQL Editor do Supabase. Idempotente.
-- ==========================================================================

create or replace view v_numeros_campanha as
with e as (
  select id from edicao where ativa = true limit 1
)
select
  -- Volumes
  (select count(*) from votantes where edicao_id = (select id from e))::int                              as votantes_unicos,
  (select count(*) from votos vt
     join votantes v on v.id = vt.votante_id
     where v.edicao_id = (select id from e))::int                                                         as votos_validos,
  (select count(*) from subcategorias s
     join categorias c on c.id = s.categoria_id
     where s.ativa and c.ativa)::int                                                                      as subcategorias_ativas,
  (select count(*) from candidatos where status = 'aprovado')::int                                        as candidatos_elegiveis,

  -- Validacoes anti-fraude (do votante)
  (select count(*) from votantes where edicao_id = (select id from e) and spc_validado)::int              as com_spc_validado,
  (select count(*) from votantes where edicao_id = (select id from e) and whatsapp_validado)::int         as com_whatsapp_validado,
  (select count(*) from votantes where edicao_id = (select id from e) and selfie_url is not null)::int    as com_selfie,

  -- Distribuicao tecnica
  (select count(distinct ip) from votantes where edicao_id = (select id from e))::int                     as ips_distintos,
  (select count(distinct device_fingerprint) from votantes
     where edicao_id = (select id from e) and device_fingerprint is not null)::int                        as dispositivos_distintos,

  -- Sinais anti-fraude detectados
  (select count(*) from rate_limit_ip where acao = 'identificar')::int                                    as tentativas_identificacao,
  (select count(*) from whatsapp_codigos where not validado)::int                                         as otps_nao_validados,
  (select count(*) from v_fingerprints_compartilhados where total >= 2)::int                              as dispositivos_compartilhados,

  -- Pico de votos
  (select count(*) from votos vt
     join votantes v on v.id = vt.votante_id
     where v.edicao_id = (select id from e)
       and (vt.criado_em at time zone 'America/Sao_Paulo')::date = (
         select (criado_em at time zone 'America/Sao_Paulo')::date
         from votos vt2 join votantes v2 on v2.id = vt2.votante_id
         where v2.edicao_id = (select id from e)
         group by 1 order by count(*) desc limit 1
       ))::int                                                                                            as votos_dia_pico,
  (select to_char((criado_em at time zone 'America/Sao_Paulo')::date, 'DD/MM/YYYY')
     from votos vt join votantes v on v.id = vt.votante_id
     where v.edicao_id = (select id from e)
     group by (criado_em at time zone 'America/Sao_Paulo')::date
     order by count(*) desc limit 1)                                                                      as data_dia_pico;
