// Wallet de creditos prepago — todo voto, marketing e manutencao consome
// daqui. Recargas via Mercado Pago creditam aqui (api/creditos/webhook).
//
// Tabela `creditos_tenant.saldo_centavos` e' a fonte da verdade. Helpers
// usam funcoes SQL `debitar_credito` e `creditar_credito` pra garantir
// atomicidade (pra ninguem debitar 2x simultaneamente).

import { createSupabaseAdminClient } from "@/lib/supabase/server";

// PRECOS, MotivoDebito e formatarReais vivem em lib/creditos/precos pra
// poderem ser importados por client components sem puxar a dependencia
// de next/headers via createSupabaseAdminClient.
export { PRECOS, formatarReais } from "./precos";
export type { MotivoDebito } from "./precos";
import { PRECOS, type MotivoDebito } from "./precos";

export type DebitarResultado =
  | { ok: true; saldo_anterior: number; saldo_atual: number }
  | { ok: false; saldo_atual: number; motivo: string };

// Debita do saldo do tenant. Atomico via SQL function. Se saldo
// insuficiente, retorna { ok: false } sem alterar nada.
export async function debitarCredito(input: {
  tenantId: string;
  motivo: MotivoDebito;
  descricao?: string;
  votanteId?: string;
  edicaoId?: string;
}): Promise<DebitarResultado> {
  const valor = PRECOS[input.motivo];
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("debitar_credito", {
    p_tenant_id: input.tenantId,
    p_valor_centavos: valor,
    p_motivo: input.motivo,
    p_descricao: input.descricao ?? null,
    p_votante_id: input.votanteId ?? null,
    p_edicao_id: input.edicaoId ?? null,
  });

  if (error) {
    return { ok: false, saldo_atual: 0, motivo: error.message };
  }

  const row = (data as { ok: boolean; saldo_anterior: number; saldo_atual: number; motivo_falha: string | null }[])?.[0];
  if (!row) {
    return { ok: false, saldo_atual: 0, motivo: "RPC sem retorno" };
  }

  if (!row.ok) {
    return { ok: false, saldo_atual: row.saldo_atual, motivo: row.motivo_falha ?? "?" };
  }
  return { ok: true, saldo_anterior: row.saldo_anterior, saldo_atual: row.saldo_atual };
}

// Adiciona credito (recarga, cortesia, estorno).
export async function creditarCredito(input: {
  tenantId: string;
  valorCentavos: number;
  motivo: "recarga" | "cortesia" | "estorno" | "reembolso";
  descricao?: string;
  pagamentoId?: string;
}): Promise<{ saldo_anterior: number; saldo_atual: number }> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("creditar_credito", {
    p_tenant_id: input.tenantId,
    p_valor_centavos: input.valorCentavos,
    p_motivo: input.motivo,
    p_descricao: input.descricao ?? null,
    p_pagamento_id: input.pagamentoId ?? null,
  });
  if (error) throw error;
  const row = (data as { saldo_anterior: number; saldo_atual: number }[])?.[0];
  if (!row) throw new Error("RPC sem retorno");
  return row;
}

// Le o saldo atual do tenant. Cria registro com saldo 0 se nao existir.
export async function getSaldo(tenantId: string): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("creditos_tenant")
    .select("saldo_centavos")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return data?.saldo_centavos ?? 0;
}
