import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getAdminTenantOuNull } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { criarPagamento, mercadoPagoConfigurado } from "@/lib/mercadopago/client";

// Recebe os dados do Payment Brick (Checkout Transparente):
// - cartao: { token, payment_method_id, installments, issuer_id, payer{...} }
// - pix:    { payment_method_id: 'pix', payer{...} }
const Body = z.object({
  valor_centavos: z.number().int().min(500).max(100000000),
  payment_method_id: z.string().min(1),
  token: z.string().nullable().optional(),
  installments: z.number().int().min(1).max(24).nullable().optional(),
  issuer_id: z.string().nullable().optional(),
  payer: z.object({
    email: z.string().email(),
    identification: z
      .object({
        type: z.string(),
        number: z.string(),
      })
      .optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
  }),
});

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const tenant = await getAdminTenantOuNull();
  if (!tenant) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }
  if (!mercadoPagoConfigurado()) {
    return NextResponse.json(
      { error: "Pagamento não configurado. Avise o suporte." },
      { status: 503 }
    );
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const isPix = parsed.data.payment_method_id === "pix";

  // 1. Cria pagamento `pendente` no banco
  const { data: pagamento, error: insertErr } = await supabase
    .from("pagamentos")
    .insert({
      tenant_id: tenant.id,
      valor_centavos: parsed.data.valor_centavos,
      status: "pendente",
      metodo: isPix ? "pix" : "cartao",
      email_comprador: parsed.data.payer.email,
      expira_em: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    })
    .select("id")
    .single();

  if (insertErr || !pagamento) {
    return NextResponse.json(
      { error: `Falha ao registrar: ${insertErr?.message ?? "?"}` },
      { status: 500 }
    );
  }

  // 2. Cria pagamento direto na MP (Checkout Transparente)
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `https://${tenant.dominio ?? "melhoresdoano.app.br"}`;

  const result = await criarPagamento({
    pagamentoId: pagamento.id,
    valorCentavos: parsed.data.valor_centavos,
    descricao: `Recarga ${tenant.nome} — Melhores do Ano`,
    notificationUrl: `${siteUrl}/api/creditos/webhook`,
    token: parsed.data.token ?? null,
    paymentMethodId: parsed.data.payment_method_id,
    installments: parsed.data.installments ?? null,
    issuerId: parsed.data.issuer_id ?? null,
    payer: parsed.data.payer,
  });

  if (!result.ok) {
    await supabase
      .from("pagamentos")
      .update({
        status: "cancelado",
        mp_payload: { erro: result.detalhe },
      })
      .eq("id", pagamento.id);
    return NextResponse.json(
      { error: `Mercado Pago: ${result.detalhe}` },
      { status: 502 }
    );
  }

  // 3. Salva referencias do MP + status retornado
  // Pra cartao: pode ja' vir 'approved' (creditamos via webhook idempotente)
  // Pra pix: vem 'pending' com QR code, paga depois e webhook credita
  const novoStatus =
    result.status === "approved"
      ? "pago"
      : result.status === "rejected" || result.status === "cancelled"
        ? "cancelado"
        : "pendente";

  await supabase
    .from("pagamentos")
    .update({
      mp_payment_id: result.paymentId,
      mp_qr_code: result.qrCode,
      mp_qr_code_base64: result.qrCodeBase64,
      mp_init_point: result.ticketUrl,
      mp_payload: result.payload as Record<string, unknown>,
      status: novoStatus,
      pago_em: novoStatus === "pago" ? new Date().toISOString() : null,
    })
    .eq("id", pagamento.id);

  return NextResponse.json({
    ok: true,
    pagamento_id: pagamento.id,
    status: result.status,
    status_detail: result.statusDetail,
    qr_code: result.qrCode,
    qr_code_base64: result.qrCodeBase64,
  });
}
