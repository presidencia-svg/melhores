import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { creditarCredito } from "@/lib/creditos";
import { consultarPagamento } from "@/lib/mercadopago/client";

// Webhook Mercado Pago — recebe notificacao { type, action, data: { id } }
// quando status de pagamento muda. Nao confiamos no payload puro: consultamos
// /v1/payments/{id} pra ver status real.
//
// MP chama esse endpoint via POST. external_reference no MP e' nosso
// pagamento.id, que vem em payment.external_reference depois de consultar.
//
// Validacao de assinatura: MP envia x-signature: "ts=...,v1=hash" + x-request-id.
// Manifesto: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
// Hash: HMAC-SHA256(manifesto, MERCADOPAGO_WEBHOOK_SECRET) === v1
//
// Sem MERCADOPAGO_WEBHOOK_SECRET configurado: aceita sem validar (dev/legacy).

function verifySignature(
  secret: string,
  signatureHeader: string,
  requestId: string,
  dataId: string
): boolean {
  // x-signature: "ts=1704908010,v1=abc123..."
  const parts = signatureHeader.split(",").map((p) => p.trim());
  const tsPart = parts.find((p) => p.startsWith("ts="))?.slice(3);
  const v1Part = parts.find((p) => p.startsWith("v1="))?.slice(3);
  if (!tsPart || !v1Part) return false;

  // Anti-replay janela 5min
  const ts = parseInt(tsPart, 10);
  if (!Number.isFinite(ts)) return false;
  const ageMs = Math.abs(Date.now() - ts * 1000);
  if (ageMs > 5 * 60_000) return false;

  const manifesto = `id:${dataId};request-id:${requestId};ts:${tsPart};`;
  const expected = createHmac("sha256", secret).update(manifesto).digest("hex");

  // timing-safe compare
  const a = Buffer.from(v1Part, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "json inválido" }, { status: 400 });
  }

  // Valida assinatura HMAC. Se nao tem secret no env, pula a checagem
  // (preserva ambientes dev). Em prod a env deve estar setada.
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim() ?? "";
  if (secret) {
    const sigHeader = req.headers.get("x-signature") ?? "";
    const requestId = req.headers.get("x-request-id") ?? "";
    const data = body.data as { id?: string | number } | undefined;
    const dataIdForSig = data?.id ? String(data.id) : "";

    if (!sigHeader || !requestId || !dataIdForSig) {
      console.warn("[creditos/webhook] headers de assinatura ausentes");
      return NextResponse.json(
        { ok: false, error: "headers de assinatura ausentes" },
        { status: 401 }
      );
    }

    const valid = verifySignature(secret, sigHeader, requestId, dataIdForSig);
    if (!valid) {
      console.warn(
        `[creditos/webhook] assinatura invalida pra payment_id=${dataIdForSig}`
      );
      return NextResponse.json(
        { ok: false, error: "assinatura inválida" },
        { status: 401 }
      );
    }
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
      // Postgres 23505 = unique_violation. Defesa contra dupla creditagem
      // por webhook duplicado/race — migration 055 cria unique partial em
      // transacoes_credito.pagamento_id WHERE motivo='recarga'. Se ja foi
      // creditado, e' idempotente: retorna ok sem creditar de novo.
      const code = (e as { code?: string } | null)?.code;
      const msg = (e as Error | null)?.message ?? "";
      if (code === "23505" || msg.includes("ux_transacoes_recarga_pagamento")) {
        console.log(
          `[creditos/webhook] recarga ${pagamento.id} ja' processada (idempotente)`
        );
        return NextResponse.json({ ok: true, already_credited: true });
      }
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
