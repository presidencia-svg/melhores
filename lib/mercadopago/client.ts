// Cliente Mercado Pago — Checkout Transparente.
//
// Mesma conta MP usada no CupomPro. Aqui usamos Checkout Transparente:
// o cliente nao sai do nosso site — o Payment Brick (frontend) coleta
// os dados, o SDK tokeniza no browser, e nos chamamos /v1/payments
// pelo backend pra processar.
//
// Fluxo cartao:
//   1. Frontend renderiza Payment Brick (@mercadopago/sdk-react)
//   2. Cliente preenche cartao, brick tokeniza client-side
//   3. Brick chama nosso onSubmit com {token, payment_method_id, ...}
//   4. Backend POST /v1/payments → MP processa e retorna status real
//
// Fluxo Pix:
//   1. Frontend mesmo brick (aba Pix) -> onSubmit({payment_method_id:'pix'})
//   2. Backend POST /v1/payments com pix
//   3. MP retorna QR code base64 + copia/cola
//   4. Frontend mostra QR, pagamento confirma via webhook
//
// ENV vars:
//   MERCADOPAGO_ACCESS_TOKEN     (server) — token APP_USR-xxx
//   NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY (client) — public key APP_USR-xxx
//   NEXT_PUBLIC_SITE_URL         — base pra notification_url

import { MercadoPagoConfig, Payment } from "mercadopago";

function getToken(): string {
  return process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() ?? "";
}

export function mercadoPagoConfigurado(): boolean {
  return getToken() !== "";
}

function getClient() {
  return new MercadoPagoConfig({ accessToken: getToken() });
}

export type CriarPagamentoInput = {
  pagamentoId: string;        // nosso UUID, vai como external_reference
  valorCentavos: number;
  descricao: string;
  notificationUrl: string;

  // Vindos do Payment Brick (formData):
  token?: string | null;            // cartao tokenizado
  paymentMethodId: string;          // 'visa' | 'master' | 'pix' | etc
  installments?: number | null;     // 1..12 pra cartao
  issuerId?: string | null;
  payer: {
    email: string;
    identification?: { type: string; number: string };
    first_name?: string;
    last_name?: string;
  };
};

export type CriarPagamentoResult =
  | {
      ok: true;
      paymentId: string;
      status: string;                // approved | pending | in_process | rejected
      statusDetail: string | null;
      // Pix only:
      qrCode?: string | null;        // copia-e-cola
      qrCodeBase64?: string | null;  // PNG base64 sem prefixo
      ticketUrl?: string | null;
      payload: unknown;
    }
  | { ok: false; detalhe: string; payload?: unknown };

export async function criarPagamento(
  input: CriarPagamentoInput
): Promise<CriarPagamentoResult> {
  if (!mercadoPagoConfigurado()) {
    return { ok: false, detalhe: "MERCADOPAGO_ACCESS_TOKEN não configurado" };
  }

  try {
    const payment = new Payment(getClient());
    const isPix = input.paymentMethodId === "pix";

    type PaymentBody = {
      transaction_amount: number;
      description: string;
      payment_method_id: string;
      external_reference: string;
      notification_url: string;
      statement_descriptor?: string;
      payer: {
        email: string;
        identification?: { type: string; number: string };
        first_name?: string;
        last_name?: string;
      };
      token?: string;
      installments?: number;
      issuer_id?: string;
      date_of_expiration?: string;
    };

    const body: PaymentBody = {
      transaction_amount: input.valorCentavos / 100,
      description: input.descricao,
      payment_method_id: input.paymentMethodId,
      external_reference: input.pagamentoId,
      notification_url: input.notificationUrl,
      statement_descriptor: "MELHORES",
      payer: input.payer,
    };

    if (!isPix && input.token) {
      body.token = input.token;
      body.installments = input.installments ?? 1;
      if (input.issuerId) body.issuer_id = input.issuerId;
    }

    if (isPix) {
      // Pix expira em 7 dias
      body.date_of_expiration = new Date(
        Date.now() + 7 * 86_400_000
      ).toISOString();
    }

    const result = await payment.create({
      body: body as Parameters<typeof payment.create>[0]["body"],
      requestOptions: {
        // Idempotencia — mesmo pagamento_id nao cria 2x
        idempotencyKey: `pagamento-${input.pagamentoId}`,
      },
    });

    if (!result.id || !result.status) {
      return {
        ok: false,
        detalhe: "MP não retornou id/status",
        payload: result,
      };
    }

    const poiData = (
      result.point_of_interaction as
        | {
            transaction_data?: {
              qr_code?: string;
              qr_code_base64?: string;
              ticket_url?: string;
            };
          }
        | undefined
    )?.transaction_data;

    return {
      ok: true,
      paymentId: String(result.id),
      status: result.status,
      statusDetail: result.status_detail ?? null,
      qrCode: poiData?.qr_code ?? null,
      qrCodeBase64: poiData?.qr_code_base64 ?? null,
      ticketUrl: poiData?.ticket_url ?? null,
      payload: result,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro desconhecido";
    return { ok: false, detalhe: msg };
  }
}

// Consulta status pra confirmar antes de creditar (usado no webhook).
export async function consultarPagamento(
  paymentId: string
): Promise<{ status: string | null; payload: unknown }> {
  if (!mercadoPagoConfigurado()) {
    return { status: null, payload: { erro: "token não configurado" } };
  }
  try {
    const payment = new Payment(getClient());
    const result = await payment.get({ id: paymentId });
    return { status: result.status ?? null, payload: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro desconhecido";
    return { status: null, payload: { erro: msg } };
  }
}
