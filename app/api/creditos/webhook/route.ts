import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { creditarCredito } from "@/lib/creditos";
import { consultarPagamento } from "@/lib/mercadopago/client";

// Webhook Mercado Pago — recebe notificacao { type, action, data: { id } }
// quando status de pagamento muda. Nao confiamos no payload puro: consultamos
// /v1/payments/{id} pra ver status real.
//
// MP chama esse endpoint via POST. external_reference no MP e' nosso
// pagamento.id, que vem em payment.external_reference depois de consultar.

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "json inválido" }, { status: 400 });
  }

  // MP manda dois tipos de evento; ambos com data.id
  const tipo = (body.type as string) ?? (body.action as string) ?? "";
  if (!tipo.includes("payment")) {
    return NextResponse.json({ ok: true, ignored: "tipo nao-payment" });
  }

  const data = body.data as { id?: string | number } | undefined;
  const paymentId = data?.id ? String(data.id) : null;
  if (!paymentId) {
    return NextResponse.json({ ok: true, ignored: "sem id" });
  }

  // Consulta pagamento real no MP
  const { status: mpStatus, payload } = await consultarPagamento(paymentId);
  if (!mpStatus) {
    console.warn("[creditos/webhook] MP sem status pra", paymentId);
    return NextResponse.json({ ok: true, ignored: "sem status MP" });
  }

  const externalRef = (payload as { external_reference?: string })
    ?.external_reference;
  if (!externalRef) {
    console.warn("[creditos/webhook] MP sem external_reference:", paymentId);
    return NextResponse.json({ ok: true, ignored: "sem external_reference" });
  }

  const supabase = createSupabaseAdminClient();
  const { data: pagamento } = await supabase
    .from("pagamentos")
    .select("*")
    .eq("id", externalRef)
    .maybeSingle();

  if (!pagamento) {
    console.warn("[creditos/webhook] pagamento nao achado:", externalRef);
    return NextResponse.json({ ok: true, ignored: "pagamento nao encontrado" });
  }

  if (pagamento.status === "pago") {
    return NextResponse.json({ ok: true, already_processed: true });
  }

  console.log(
    `[creditos/webhook] pagamento ${pagamento.id} status MP: ${mpStatus}`
  );

  if (mpStatus === "approved") {
    await supabase
      .from("pagamentos")
      .update({
        status: "pago",
        pago_em: new Date().toISOString(),
        mp_payment_id: paymentId,
        mp_payload: payload as Record<string, unknown>,
      })
      .eq("id", pagamento.id);

    try {
      await creditarCredito({
        tenantId: pagamento.tenant_id,
        valorCentavos: pagamento.valor_centavos,
        motivo: "recarga",
        descricao: `Recarga via Mercado Pago (${pagamento.valor_centavos / 100} BRL)`,
        pagamentoId: pagamento.id,
      });
    } catch (e) {
      console.error("[creditos/webhook] creditarCredito falhou:", e);
    }

    return NextResponse.json({ ok: true, status: "pago" });
  }

  if (mpStatus === "rejected" || mpStatus === "cancelled") {
    await supabase
      .from("pagamentos")
      .update({
        status: "cancelado",
        mp_payment_id: paymentId,
        mp_payload: payload as Record<string, unknown>,
      })
      .eq("id", pagamento.id);
    return NextResponse.json({ ok: true, status: "cancelado" });
  }

  // Outros (pending, in_process, authorized) — deixa pendente
  return NextResponse.json({ ok: true, status: mpStatus });
}
