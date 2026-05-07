-- ==========================================================================
-- 038-creditos-pagamentos.sql
--
-- Sistema de creditos prepago + integracao PagSeguro pra cobranca.
--
-- Modelo:
--   1. Tenant compra credito via /comprar (Pix ou cartao no PagSeguro)
--   2. PagSeguro confirma → webhook adiciona R$ X em creditos_tenant.saldo
--   3. Cada voto/marketing/manutencao debita do saldo via funcao debitar_credito
--   4. Saldo zerado → /api/identificar bloqueia novos votantes ate recarga
--
-- Tabelas:
--   - creditos_tenant: saldo atual (1 linha por tenant)
--   - transacoes_credito: log de toda movimentacao (debito + credito)
--   - pagamentos: pedidos de compra de credito (estado: pendente/pago/expirado)
--
-- Tudo escopado em tenant_id pra isolamento multi-tenant.
-- ==========================================================================

-- ==========================================================================
-- 1. creditos_tenant — 1 linha por tenant com saldo atual
-- ==========================================================================

create table if not exists creditos_tenant (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  saldo_centavos bigint not null default 0,
  -- ultimos alertas enviados (pra nao spammar)
  ultimo_alerta_50 timestamptz,
  ultimo_alerta_20 timestamptz,
  ultimo_alerta_5 timestamptz,
  ultimo_alerta_zerado timestamptz,
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_creditos_saldo_baixo
  on creditos_tenant(saldo_centavos) where saldo_centavos < 10000;

-- Backfill: tenant CDL Aracaju ganha credito inicial fake pra testar (R$ 0).
-- Outros tenants ja existentes ficam com saldo 0 e precisam comprar credito
-- pra abrir nova campanha.
insert into creditos_tenant (tenant_id, saldo_centavos)
select id, 0 from tenants
on conflict (tenant_id) do nothing;

-- ==========================================================================
-- 2. pagamentos — pedidos de compra de credito (PagSeguro)
-- (criado antes de transacoes_credito porque ela faz FK pra ca)
-- ==========================================================================

create table if not exists pagamentos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  valor_centavos bigint not null check (valor_centavos > 0),
  metodo text check (metodo in ('cartao', 'pix') or metodo is null),
  status text not null default 'pendente' check (status in (
    'pendente',  -- aguardando pagamento
    'pago',      -- pago, credito ja adicionado em creditos_tenant
    'cancelado', -- cancelado pelo usuario
    'expirado',  -- timeout sem pagamento
    'estornado'  -- pago e depois estornado
  )),
  -- referencias PagSeguro
  ps_charge_id text,
  ps_session_id text,
  ps_qr_code text,                 -- pra Pix mostrar QR
  ps_qr_code_url text,             -- url da imagem QR
  ps_payment_url text,             -- redirect URL pra cartao
  ps_payload jsonb,                -- payload completo da resposta PagSeguro
  -- email do comprador (pra checkout PagSeguro)
  email_comprador text,
  -- timestamps
  criado_em timestamptz not null default now(),
  expira_em timestamptz,
  pago_em timestamptz
);

create index if not exists idx_pagamentos_tenant
  on pagamentos(tenant_id, criado_em desc);
create index if not exists idx_pagamentos_status
  on pagamentos(status) where status = 'pendente';
create index if not exists idx_pagamentos_ps_charge
  on pagamentos(ps_charge_id) where ps_charge_id is not null;

-- ==========================================================================
-- 3. transacoes_credito — log imutavel de toda movimentacao
-- ==========================================================================

create table if not exists transacoes_credito (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  -- valor em centavos. positivo = credito (recarga), negativo = debito (uso)
  valor_centavos bigint not null,
  motivo text not null check (motivo in (
    'recarga',           -- compra via PagSeguro
    'voto_minimo',       -- R$ 0,20 (CPF + selfie)
    'voto_spc',          -- R$ 0,25 (+ SPC Brasil)
    'voto_spc_whatsapp', -- R$ 0,60 (+ WhatsApp/mailing)
    'marketing',         -- R$ 0,80 (parcial/incentivo/empate)
    'taxa_campanha',     -- R$ 500,00 (1x por edicao)
    'manutencao',        -- R$ 200,00/mes pos-campanha
    'cortesia',          -- credito manual via super-admin
    'estorno',           -- ajuste manual via super-admin
    'reembolso'          -- estorno de pagamento
  )),
  descricao text,
  -- referencias opcionais pra rastreabilidade
  pagamento_id uuid references pagamentos(id) on delete set null,
  votante_id uuid references votantes(id) on delete set null,
  edicao_id uuid references edicao(id) on delete set null,
  saldo_apos_centavos bigint not null,
  criado_em timestamptz not null default now()
);

create index if not exists idx_transacoes_tenant_criado
  on transacoes_credito(tenant_id, criado_em desc);
create index if not exists idx_transacoes_motivo
  on transacoes_credito(motivo);

-- ==========================================================================
-- 4. Funcao debitar_credito — atomico, retorna novo saldo ou erro
-- ==========================================================================

create or replace function debitar_credito(
  p_tenant_id uuid,
  p_valor_centavos bigint,  -- positivo, sera convertido em negativo no log
  p_motivo text,
  p_descricao text default null,
  p_votante_id uuid default null,
  p_edicao_id uuid default null
)
returns table (
  ok boolean,
  saldo_anterior bigint,
  saldo_atual bigint,
  motivo_falha text
)
language plpgsql
as $$
declare
  v_saldo_atual bigint;
begin
  if p_valor_centavos <= 0 then
    return query select false, 0::bigint, 0::bigint, 'valor deve ser positivo';
    return;
  end if;

  -- Lock the row to prevent races
  select saldo_centavos into v_saldo_atual
  from creditos_tenant
  where tenant_id = p_tenant_id
  for update;

  if v_saldo_atual is null then
    -- Cria registro com saldo 0 se nao existir
    insert into creditos_tenant (tenant_id, saldo_centavos) values (p_tenant_id, 0);
    v_saldo_atual := 0;
  end if;

  if v_saldo_atual < p_valor_centavos then
    return query select false, v_saldo_atual, v_saldo_atual, 'saldo insuficiente';
    return;
  end if;

  update creditos_tenant
  set saldo_centavos = saldo_centavos - p_valor_centavos,
      atualizado_em = now()
  where tenant_id = p_tenant_id;

  insert into transacoes_credito (
    tenant_id, valor_centavos, motivo, descricao,
    votante_id, edicao_id, saldo_apos_centavos
  ) values (
    p_tenant_id, -p_valor_centavos, p_motivo, p_descricao,
    p_votante_id, p_edicao_id, v_saldo_atual - p_valor_centavos
  );

  return query select true, v_saldo_atual, v_saldo_atual - p_valor_centavos, null::text;
end;
$$;

-- ==========================================================================
-- 5. Funcao creditar_credito — adicionar saldo (recarga, cortesia, estorno)
-- ==========================================================================

create or replace function creditar_credito(
  p_tenant_id uuid,
  p_valor_centavos bigint,  -- positivo
  p_motivo text,
  p_descricao text default null,
  p_pagamento_id uuid default null
)
returns table (
  saldo_anterior bigint,
  saldo_atual bigint
)
language plpgsql
as $$
declare
  v_saldo_atual bigint;
begin
  if p_valor_centavos <= 0 then
    raise exception 'valor deve ser positivo';
  end if;

  insert into creditos_tenant (tenant_id, saldo_centavos)
  values (p_tenant_id, 0)
  on conflict (tenant_id) do nothing;

  select saldo_centavos into v_saldo_atual
  from creditos_tenant
  where tenant_id = p_tenant_id
  for update;

  update creditos_tenant
  set saldo_centavos = saldo_centavos + p_valor_centavos,
      atualizado_em = now()
  where tenant_id = p_tenant_id;

  insert into transacoes_credito (
    tenant_id, valor_centavos, motivo, descricao,
    pagamento_id, saldo_apos_centavos
  ) values (
    p_tenant_id, p_valor_centavos, p_motivo, p_descricao,
    p_pagamento_id, v_saldo_atual + p_valor_centavos
  );

  return query select v_saldo_atual, v_saldo_atual + p_valor_centavos;
end;
$$;
