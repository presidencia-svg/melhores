import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { creditarCredito } from "@/lib/creditos";
import { consultarOrder } from "@/lib/pagseguro/client";

// Webhook PagSeguro — recebe notificacao de mudanca de status. NAO confiamos
// no payload puro (pode vir adulterado); a gente consulta de volta a API
// PagSeguro pra confirmar status real.
//
// PagSeguro chama esse endpoint via POST com o payload da order/charge.
// Pegamos o reference_id (que e' nosso pagamento.id) e atualizamos.

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "json inválido" }, { status: 400 });
  }

  // Tenta extrair reference_id ou order id de varias formas
  // (PagSeguro varia o payload conforme o evento)
  const referenceId =
    (body.reference_id as string) ??
    (body.charges as Array<{ reference_id?: string }>)?.[0]?.reference_id ??
    null;
  const orderId =
    (body.id as string) ??
    null;

  if (!referenceId && !orderId) {
    console.warn("[creditos/webhook] payload sem reference_id nem orderId:", body);
    return NextResponse.json({ ok: true, ignored: true });
  }

  const supabase = createSupabaseAdminClient();

  // 1. Acha o pagamento pelo reference_id (nosso UUID) ou ps_charge_id
  let query = supabase.from("pagamentos").select("*");
  if (referenceId) query = query.eq("id", referenceId);
  else if (orderId) query = query.eq("ps_charge_id", orderId);

  const { data: pagamento } = await query.maybeSingle();

  if (!pagamento) {
    console.warn("[creditos/webhook] pagamento nao encontrado:", { referenceId, orderId });
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (pagamento.status === "pago") {
    // Idempotencia — ja processamos.
    return NextResponse.json({ ok: true, already_processed: true });
  }

  // 2. Consulta status REAL do PagSeguro (nao confia no payload do webhook)
  const psOrderId = pagamento.ps_charge_id ?? orderId;
  if (!psOrderId) {
    return NextResponse.json({ ok: true, ignored: "sem orderId" });
  }
  const { status: psStatus, payload: psPayload } = await consultarOrder(psOrderId);

  console.log(`[creditos/webhook] pagamento ${pagamento.id} status PagSeguro: ${psStatus}`);

  if (psStatus === "PAID") {
    // 3. Atualiza pagamento → pago + adiciona credito
    await supabase
      .from("pagamentos")
      .update({
        status: "pago",
        pago_em: new Date().toISOString(),
        ps_payload: psPayload as Record<string, unknown>,
      })
      .eq("id", pagamento.id);

    try {
      await creditarCredito({
        tenantId: pagamento.tenant_id,
        valorCentavos: pagamento.valor_centavos,
        motivo: "recarga",
        descricao: `Recarga via PagSeguro (${pagamento.valor_centavos / 100} BRL)`,
        pagamentoId: pagamento.id,
      });
    } catch (e) {
      console.error("[creditos/webhook] creditarCredito falhou:", e);
      // Nao retornamos erro — pagamento esta marcado como pago, podemos
      // reconciliar manualmente via super-admin. Mais critico nao perder
      // o webhook do PagSeguro.
    }

    return NextResponse.json({ ok: true, status: "pago" });
  }

  if (psStatus === "DECLINED" || psStatus === "CANCELED") {
    await supabase
      .from("pagamentos")
      .update({
        status: "cancelado",
        ps_payload: psPayload as Record<string, unknown>,
      })
      .eq("id", pagamento.id);
    return NextResponse.json({ ok: true, status: "cancelado" });
  }

  // Outros status (WAITING, IN_ANALYSIS) — deixa pendente
  return NextResponse.json({ ok: true, status: psStatus ?? "pendente" });
}
