-- ==========================================================================
-- 047-deletar-tenant-completo.sql
--
-- RPC pra deletar um tenant inteiro e tudo que pertence a ele. Usado pelo
-- super-admin pra limpar tenants de teste ou cancelados.
--
-- Como `edicao.tenant_id` e' on delete RESTRICT (impede orfao acidental),
-- DELETE direto em tenants falha enquanto houver edicao. A funcao roda
-- na ordem certa, dentro de uma transacao.
--
-- Ordem:
--   1. votos (FK pra edicao_id, cascade ja existente — explicit p/ ser
--      independente de cascade configurado em tabela legacy)
--   2. candidatos
--   3. subcategorias
--   4. categorias
--   5. votantes
--   6. edicoes (libera o restrict no tenant)
--   7. tenant (cascata pra app_config, creditos_tenant, transacoes_credito,
--      pagamentos via on delete cascade nos respectivos FKs)
--
-- ATENCAO: nao apaga arquivos no Supabase Storage (logos, selfies). Cleanup
-- de storage e' manual no dashboard se quiser liberar espaco.
-- ==========================================================================

create or replace function deletar_tenant_completo(p_tenant_id uuid)
returns table (
  ok boolean,
  detalhe text,
  votos_apagados bigint,
  votantes_apagados bigint,
  candidatos_apagados bigint,
  edicoes_apagadas bigint
)
language plpgsql
security definer
as $$
declare
  v_existe boolean;
  v_votos bigint := 0;
  v_votantes bigint := 0;
  v_candidatos bigint := 0;
  v_edicoes bigint := 0;
begin
  select exists(select 1 from tenants where id = p_tenant_id) into v_existe;
  if not v_existe then
    return query select false, 'tenant nao encontrado', 0::bigint, 0::bigint, 0::bigint, 0::bigint;
    return;
  end if;

  -- 1. votos
  with d as (
    delete from votos
    where edicao_id in (select id from edicao where tenant_id = p_tenant_id)
    returning 1
  )
  select count(*) into v_votos from d;

  -- 2. candidatos
  with d as (
    delete from candidatos
    where edicao_id in (select id from edicao where tenant_id = p_tenant_id)
    returning 1
  )
  select count(*) into v_candidatos from d;

  -- 3. subcategorias
  delete from subcategorias
  where edicao_id in (select id from edicao where tenant_id = p_tenant_id);

  -- 4. categorias
  delete from categorias
  where edicao_id in (select id from edicao where tenant_id = p_tenant_id);

  -- 5. votantes
  with d as (
    delete from votantes
    where edicao_id in (select id from edicao where tenant_id = p_tenant_id)
    returning 1
  )
  select count(*) into v_votantes from d;

  -- 6. edicoes
  with d as (
    delete from edicao where tenant_id = p_tenant_id returning 1
  )
  select count(*) into v_edicoes from d;

  -- 7. tenant — cascata pra app_config, creditos_tenant, transacoes, pagamentos
  delete from tenants where id = p_tenant_id;

  return query select
    true,
    'tenant deletado'::text,
    v_votos,
    v_votantes,
    v_candidatos,
    v_edicoes;
end;
$$;
