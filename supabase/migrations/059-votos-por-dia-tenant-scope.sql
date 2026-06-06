-- ==========================================================================
-- 059-votos-por-dia-tenant-scope.sql
--
-- Bug: RPC votos_por_dia_detalhe(p_dia) agregava votos globalmente,
-- sem filtrar por tenant. Endpoint /api/admin/votos-dia/[dia] chama
-- a RPC e devolve total/por_hora/por_so do dia, vazando metricas
-- de TODOS os tenants pra admin de qualquer um. Severidade: medio
-- (nao identifica pessoas, mas vaza atividade da concorrencia).
--
-- Fix: adiciona p_tenant_id e filtra votos via join votos -> votantes
-- -> edicao (tenant_id). Drop + recreate (assinatura mudou).
--
-- Endpoint /api/admin/votos-dia/[dia] passa tenant.id na chamada.
-- ==========================================================================

drop function if exists public.votos_por_dia_detalhe(date);

create function public.votos_por_dia_detalhe(p_dia date, p_tenant_id uuid)
  returns jsonb
  language sql
  stable
as $$
  with votos_do_dia as (
    select
      v.id,
      v.criado_em,
      v.votante_id,
      vt.user_agent,
      extract(hour from (v.criado_em at time zone 'America/Sao_Paulo'))::int as hora
    from votos v
    join votantes vt on vt.id = v.votante_id
    join edicao e on e.id = vt.edicao_id
    where (v.criado_em at time zone 'America/Sao_Paulo')::date = p_dia
      and e.tenant_id = p_tenant_id
  ),
  por_hora as (
    select hora, count(*)::int as total
    from votos_do_dia
    group by hora
  ),
  por_so as (
    select
      case
        when user_agent is null or user_agent = '' then 'desconhecido'
        when user_agent ~* 'iphone|ipad|ipod'                then 'ios'
        when user_agent ~* 'android'                         then 'android'
        when user_agent ~* 'macintosh|mac os'                then 'mac'
        when user_agent ~* 'windows'                         then 'windows'
        when user_agent ~* 'linux|x11'                       then 'linux'
        else 'outro'
      end as so,
      count(*)::int as total
    from votos_do_dia
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

revoke execute on function public.votos_por_dia_detalhe(date, uuid)
  from public, anon, authenticated;
grant execute on function public.votos_por_dia_detalhe(date, uuid)
  to service_role;
