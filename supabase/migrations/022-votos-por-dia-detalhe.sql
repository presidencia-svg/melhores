-- ==========================================================================
-- 022-votos-por-dia-detalhe.sql
--
-- RPC pra drill-down do card "Votos por dia" no dashboard. Recebe um dia
-- (BRT) e devolve dois agregados num unico round-trip:
--   1) por_hora: 24 buckets (0-23h)
--   2) por_so:   classificacao do user_agent do votante (ios/android/etc)
--
-- Por que JSON: o cliente quer as duas series numa chamada so e PostgREST
-- nao deixa retornar duas tabelas diferentes facil. JSON resolve.
--
-- Roda no SQL Editor do Supabase apos deploy. Idempotente.
-- ==========================================================================

create or replace function votos_por_dia_detalhe(p_dia date)
returns jsonb
language sql
stable
as $$
  with votos_do_dia as (
    select
      v.id,
      v.criado_em,
      v.votante_id,
      extract(hour from (v.criado_em at time zone 'America/Sao_Paulo'))::int as hora
    from votos v
    where (v.criado_em at time zone 'America/Sao_Paulo')::date = p_dia
  ),
  por_hora as (
    select hora, count(*)::int as total
    from votos_do_dia
    group by hora
  ),
  por_so as (
    select
      case
        when vt.user_agent is null or vt.user_agent = '' then 'desconhecido'
        when vt.user_agent ~* 'iphone|ipad|ipod'                then 'ios'
        when vt.user_agent ~* 'android'                         then 'android'
        when vt.user_agent ~* 'macintosh|mac os'                then 'mac'
        when vt.user_agent ~* 'windows'                         then 'windows'
        when vt.user_agent ~* 'linux|x11'                       then 'linux'
        else 'outro'
      end as so,
      count(*)::int as total
    from votos_do_dia vd
    join votantes vt on vt.id = vd.votante_id
    group by 1
  )
  select jsonb_build_object(
    'dia',     p_dia,
    'total',   (select count(*) from votos_do_dia),
    'por_hora', coalesce(
      (select jsonb_agg(jsonb_build_object('hora', hora, 'total', total) order by hora)
       from por_hora),
      '[]'::jsonb
    ),
    'por_so',  coalesce(
      (select jsonb_agg(jsonb_build_object('so', so, 'total', total) order by total desc)
       from por_so),
      '[]'::jsonb
    )
  );
$$;
