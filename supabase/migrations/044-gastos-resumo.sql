-- ==========================================================================
-- 044-gastos-resumo.sql
--
-- RPC pra agregar gastos por motivo (votos, marketing, taxa, manutencao)
-- num periodo. Usada em /admin/creditos pra mostrar "Resumo de gastos"
-- sem precisar fetch de todas as transacoes (que escalam com numero de
-- votos da campanha).
--
-- Retorna apenas DEBITOS (valor_centavos < 0). Recargas/cortesias/estornos
-- ficam fora — eles entram em creditos, nao em gastos.
--
-- Roda no SQL Editor do Supabase. Idempotente.
-- ==========================================================================

create or replace function gastos_resumo_tenant(
  p_tenant_id uuid,
  p_desde timestamptz
)
returns table (
  motivo text,
  total_centavos bigint,
  qtd bigint
)
language sql
stable
as $$
  select
    motivo,
    -- total positivo (valor negativo de debito vira gasto positivo)
    (-sum(valor_centavos))::bigint as total_centavos,
    count(*)::bigint as qtd
  from transacoes_credito
  where tenant_id = p_tenant_id
    and criado_em >= p_desde
    and valor_centavos < 0
  group by motivo
  order by sum(valor_centavos) asc;  -- maior gasto primeiro (numero mais negativo)
$$;
