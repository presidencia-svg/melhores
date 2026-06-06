-- ==========================================================================
-- 060-elegiveis-parcial-tenant-scope.sql
--
-- Bug LGPD: RPC elegiveis_parcial() retornava nome+whatsapp+votos_count
-- de TODOS os votantes elegiveis de TODOS os tenants. Endpoint
-- /api/admin/whatsapp/parcial/preview chama essa RPC pra mostrar pra
-- quem vai disparar a parcial — admin de A via os dados pessoais de B.
--
-- Fix: dropa e recria com p_edicao_id obrigatorio + REVOKE pra anon/
-- authenticated. Endpoint passa edicao do tenant logado.
-- ==========================================================================

drop function if exists public.elegiveis_parcial();

create function public.elegiveis_parcial(p_edicao_id uuid)
  returns table(
    votante_id uuid,
    votante_nome text,
    whatsapp text,
    criado_em timestamptz,
    votos_count bigint
  )
  language sql
  stable
as $$
  select
    v.id,
    v.nome,
    v.whatsapp,
    v.criado_em,
    (select count(*) from votos where votante_id = v.id)::bigint as votos_count
  from votantes v
  where v.edicao_id = p_edicao_id
    and v.whatsapp_validado = true
    and v.parcial_enviada_em is null
    and v.whatsapp is not null
    and exists (select 1 from votos where votante_id = v.id)
  order by v.criado_em asc;
$$;

revoke execute on function public.elegiveis_parcial(uuid)
  from public, anon, authenticated;
grant execute on function public.elegiveis_parcial(uuid)
  to service_role;
