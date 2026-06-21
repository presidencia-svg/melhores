-- ==========================================================================
-- 065-votos-views-filtram-pendentes.sql
--
-- Contexto: no modo "aprovacao" de sugestao publica, votante pode
-- sugerir um candidato (entra como pendente) E registrar voto nele.
-- O voto fica no banco mas SO' deve aparecer nas contagens quando
-- admin aprovar o candidato em /admin/sugestoes. Se admin rejeitar
-- (DELETE), o ON DELETE CASCADE em votos.candidato_id leva o voto
-- junto.
--
-- v_resultados ja' filtrava por candidatos.status='aprovado'. Esta
-- migration faz o mesmo nas views que contam votos diretamente da
-- tabela votos (sem passar por v_resultados):
--   - v_votos_por_dia
--   - v_votos_por_hora_hoje
--   - v_resumo_hoje
-- ==========================================================================

create or replace view public.v_votos_por_dia as
  select v.edicao_id,
         (v.criado_em at time zone 'America/Sao_Paulo')::date as dia,
         count(*) as total
  from votos v
  join candidatos c on c.id = v.candidato_id
  where v.criado_em >= (now() - '90 days'::interval)
    and c.status = 'aprovado'
  group by v.edicao_id, ((v.criado_em at time zone 'America/Sao_Paulo')::date)
  order by ((v.criado_em at time zone 'America/Sao_Paulo')::date);

create or replace view public.v_votos_por_hora_hoje as
  select v.edicao_id,
         extract(hour from (v.criado_em at time zone 'America/Sao_Paulo'))::integer as hora,
         count(*)::integer as total
  from votos v
  join candidatos c on c.id = v.candidato_id
  where (v.criado_em at time zone 'America/Sao_Paulo')::date = (now() at time zone 'America/Sao_Paulo')::date
    and c.status = 'aprovado'
  group by v.edicao_id, (extract(hour from (v.criado_em at time zone 'America/Sao_Paulo')))
  order by (extract(hour from (v.criado_em at time zone 'America/Sao_Paulo')));

create or replace view public.v_resumo_hoje as
  with hoje as (
    select (now() at time zone 'America/Sao_Paulo')::date as d
  )
  select e.id as edicao_id,
    ((select count(*) from votos v
       join candidatos c on c.id = v.candidato_id
       where v.edicao_id = e.id
         and (v.criado_em at time zone 'America/Sao_Paulo')::date = (select d from hoje)
         and c.status = 'aprovado'
     ))::integer as votos,
    ((select count(*) from votantes
       where votantes.edicao_id = e.id
         and (votantes.criado_em at time zone 'America/Sao_Paulo')::date = (select d from hoje)
     ))::integer as votantes,
    ((select count(*) from whatsapp_codigos w
       join votantes vt on vt.id = w.votante_id
       where vt.edicao_id = e.id
         and (w.criado_em at time zone 'America/Sao_Paulo')::date = (select d from hoje)
     ))::integer as otps,
    ((select count(*) from votantes
       where votantes.edicao_id = e.id
         and votantes.parcial_enviada_em is not null
         and (votantes.parcial_enviada_em at time zone 'America/Sao_Paulo')::date = (select d from hoje)
     ))::integer as parciais
  from edicao e;
