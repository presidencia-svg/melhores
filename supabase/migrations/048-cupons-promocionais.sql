-- ==========================================================================
-- 048-cupons-promocionais.sql
--
-- Cupons promocionais em creditos. Super-admin cria via /super/cupons,
-- tenant resgata via /admin/creditos. Cada resgate adiciona o valor do
-- cupom no saldo do tenant (creditos_tenant) e loga em transacoes_credito
-- com motivo='cupom'.
--
-- 3 tipos:
--   - 'multi_tenant_1x_cada': varios tenants podem usar, cada um 1 vez
--     (default — bom pra campanha de marketing geral, ex: BEMVINDO500)
--   - 'uso_unico_global': apenas 1 tenant resgata, depois trava
--     (bom pra cortesia individual nominal)
--   - 'multi_uso_livre': mesmo tenant pode resgatar varias vezes
--     (raro, util pra cupom recorrente)
--
-- Restricoes opcionais (combinaveis):
--   - expira_em: timestamp de validade (NULL = sem validade)
--   - max_usos: limite total de resgates (NULL = ilimitado)
--   - ativo: super-admin pode desligar manual
-- ==========================================================================

-- ==========================================================================
-- 1. cupons — cadastro
-- ==========================================================================

create table if not exists cupons (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  valor_centavos bigint not null check (valor_centavos > 0),
  tipo text not null check (tipo in (
    'multi_tenant_1x_cada',
    'uso_unico_global',
    'multi_uso_livre'
  )),
  expira_em timestamptz,
  max_usos integer check (max_usos is null or max_usos > 0),
  usos_atuais integer not null default 0,
  ativo boolean not null default true,
  descricao text,
  criado_em timestamptz not null default now()
);

-- Codigo case-insensitive — armazena em UPPER, busca em UPPER
create unique index if not exists idx_cupons_codigo_upper on cupons((upper(codigo)));
create index if not exists idx_cupons_ativo on cupons(ativo) where ativo;

-- ==========================================================================
-- 2. cupons_usos — log de cada resgate
-- ==========================================================================

create table if not exists cupons_usos (
  id uuid primary key default gen_random_uuid(),
  cupom_id uuid not null references cupons(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  valor_centavos bigint not null,
  criado_em timestamptz not null default now()
);

create index if not exists idx_cupons_usos_cupom on cupons_usos(cupom_id);
create index if not exists idx_cupons_usos_tenant on cupons_usos(tenant_id);
-- Pra checar rapido se o tenant ja usou esse cupom (tipo 1x_cada)
create index if not exists idx_cupons_usos_cupom_tenant
  on cupons_usos(cupom_id, tenant_id);

-- ==========================================================================
-- 3. Adiciona motivo 'cupom' em transacoes_credito
-- ==========================================================================

alter table transacoes_credito drop constraint if exists transacoes_credito_motivo_check;
alter table transacoes_credito add constraint transacoes_credito_motivo_check
  check (motivo in (
    'recarga', 'voto_minimo', 'voto_spc', 'voto_spc_whatsapp', 'marketing',
    'taxa_campanha', 'manutencao', 'cortesia', 'estorno', 'reembolso', 'cupom'
  ));

-- ==========================================================================
-- 4. RPC resgatar_cupom — atomic, valida e credita
-- ==========================================================================

create or replace function resgatar_cupom(
  p_codigo text,
  p_tenant_id uuid
)
returns table (
  ok boolean,
  motivo_falha text,
  valor_creditado_centavos bigint,
  saldo_atual bigint
)
language plpgsql
security definer
as $$
declare
  v_cupom record;
  v_ja_usou bigint;
  v_saldo bigint;
begin
  -- Busca cupom (case-insensitive) com lock pra evitar race em max_usos
  select * into v_cupom
  from cupons
  where upper(codigo) = upper(trim(p_codigo))
  for update;

  if v_cupom.id is null then
    return query select false, 'cupom nao encontrado'::text, 0::bigint, 0::bigint;
    return;
  end if;

  if not v_cupom.ativo then
    return query select false, 'cupom desativado'::text, 0::bigint, 0::bigint;
    return;
  end if;

  if v_cupom.expira_em is not null and v_cupom.expira_em < now() then
    return query select false, 'cupom expirado'::text, 0::bigint, 0::bigint;
    return;
  end if;

  if v_cupom.max_usos is not null and v_cupom.usos_atuais >= v_cupom.max_usos then
    return query select false, 'cupom esgotou os usos'::text, 0::bigint, 0::bigint;
    return;
  end if;

  -- Validacao por tipo
  if v_cupom.tipo = 'uso_unico_global' and v_cupom.usos_atuais >= 1 then
    return query select false, 'cupom de uso unico ja foi resgatado'::text, 0::bigint, 0::bigint;
    return;
  end if;

  if v_cupom.tipo = 'multi_tenant_1x_cada' then
    select count(*) into v_ja_usou
    from cupons_usos
    where cupom_id = v_cupom.id and tenant_id = p_tenant_id;
    if v_ja_usou > 0 then
      return query select false, 'voce ja resgatou esse cupom'::text, 0::bigint, 0::bigint;
      return;
    end if;
  end if;

  -- Tudo ok — credita, loga uso, incrementa contador
  perform creditar_credito(
    p_tenant_id,
    v_cupom.valor_centavos,
    'cupom',
    'Cupom ' || v_cupom.codigo || coalesce(' — ' || v_cupom.descricao, ''),
    null
  );

  insert into cupons_usos (cupom_id, tenant_id, valor_centavos)
  values (v_cupom.id, p_tenant_id, v_cupom.valor_centavos);

  update cupons set usos_atuais = usos_atuais + 1 where id = v_cupom.id;

  select saldo_centavos into v_saldo from creditos_tenant where tenant_id = p_tenant_id;

  return query select true, null::text, v_cupom.valor_centavos, v_saldo;
end;
$$;
