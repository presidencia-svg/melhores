// Cliente Mercado Pago — Checkout Pro (preference) com cartao + Pix.
//
// Mesmo padrao do CupomPro (mesma conta MP da EB Servicos do Cupom Pro).
//
// Fluxo Checkout Pro:
//   1. POST /checkout/preferences com itens + payment_methods + back_urls
//      + notification_url. MP retorna `init_point` (URL hosteada).
//   2. Cliente redireciona pra init_point, escolhe Pix ou cartao na pagina
//      do MP, paga, volta pro back_url.
//   3. MP envia webhook em /api/creditos/webhook (POST com {type, data.id}).
//   4. Webhook consulta /v1/payments/{id} pra confirmar status real.
//
// ENV vars necessarias:
//   MERCADOPAGO_ACCESS_TOKEN  — token APP_USR-xxx (mesmo da CupomPro)
//   NEXT_PUBLIC_SITE_URL      — base pra back_url + notification_url

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

function getToken(): string {
  return process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() ?? "";
}

export function mercadoPagoConfigurado(): boolean {
  return getToken() !== "";
}

function getClient() {
  return new MercadoPagoConfig({ accessToken: getToken() });
}

export type CriarPreferenciaResult =
  | {
      ok: true;
      preferenceId: string;
      initPoint: string;        // url hosteada pra cartao + pix
      payload: unknown;
    }
  | { ok: false; detalhe: string; payload?: unknown };

export async function criarPreferencia(input: {
  pagamentoId: string;
  valorCentavos: number;
  emailComprador: string;
  nomeComprador: string;
  redirectUrl: string;
  notificationUrl: string;
}): Promise<CriarPreferenciaResult> {
  if (!mercadoPagoConfigurado()) {
    return { ok: false, detalhe: "MERCADOPAGO_ACCESS_TOKEN nao configurado" };
  }

  try {
    const pref = new Preference(getClient());
    const result = await pref.create({
      body: {
        items: [
          {
            id: input.pagamentoId,
            title: "Recarga de creditos — Melhores do Ano",
            quantity: 1,
            currency_id: "BRL",
            unit_price: input.valorCentavos / 100, // MP usa decimal (BRL)
          },
        ],
        payer: {
          email: input.emailComprador,
          name: input.nomeComprador,
        },
        payment_methods: {
          // Permite cartao (todos) + pix. Boleto desligado.
          excluded_payment_types: [{ id: "ticket" }],
          installments: 12,
        },
        back_urls: {
          success: input.redirectUrl,
          pending: input.redirectUrl,
          failure: input.redirectUrl,
        },
        auto_return: "approved",
        notification_url: input.notificationUrl,
        external_reference: input.pagamentoId,
        statement_descriptor: "MELHORES",
        // Pix expira em 7 dias se nao for pago. Cartao processa imediato.
        expires: true,
        expiration_date_to: new Date(
          Date.now() + 7 * 86_400_000
        ).toISOString(),
      },
    });

    if (!result.id || !result.init_point) {
      return {
        ok: false,
        detalhe: "MP nao retornou init_point",
        payload: result,
      };
    }

    return {
      ok: true,
      preferenceId: result.id,
      initPoint: result.init_point,
      payload: result,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro desconhecido";
    return { ok: false, detalhe: msg };
  }
}

// Consulta status de um pagamento pra confirmar antes de creditar.
export async function consultarPagamento(
  paymentId: string
): Promise<{ status: string | null; payload: unknown }> {
  if (!mercadoPagoConfigurado()) {
    return { status: null, payload: { erro: "token nao configurado" } };
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
