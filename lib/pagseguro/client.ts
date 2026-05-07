// Cliente PagSeguro/PagBank — Checkout Pro (hosted) com cartao + Pix.
//
// Por que Checkout Pro: o cliente clica "Comprar credito" e e' redirecionado
// pra pagina hospedada do PagSeguro onde escolhe entre cartao ou Pix. Nao
// precisamos lidar com PCI/criptografia de cartao — o PagSeguro lida.
//
// Fluxo:
//   1. POST /api/creditos/comprar → criamos pagamento `pendente` no banco
//      e chamamos PagSeguro /checkouts
//   2. PagSeguro retorna `redirect_url` → mandamos o admin pra la
//   3. Admin paga (ou nao). PagSeguro chama nosso webhook /api/creditos/webhook
//   4. Webhook atualiza pagamento.status = 'pago' + creditarCredito()
//
// ENV vars necessarias:
//   PAGSEGURO_TOKEN          — token API (sandbox ou prod)
//   PAGSEGURO_AMBIENTE       — "sandbox" | "production"
//   NEXT_PUBLIC_SITE_URL     — base URL pro return/notification (ex: https://melhoresdoano.app.br)

import axios, { AxiosError } from "axios";

const ENDPOINTS = {
  sandbox: "https://sandbox.api.pagseguro.com",
  production: "https://api.pagseguro.com",
} as const;

function getEnv() {
  return {
    token: process.env.PAGSEGURO_TOKEN ?? "",
    ambiente: (process.env.PAGSEGURO_AMBIENTE ?? "sandbox") as
      | "sandbox"
      | "production",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  };
}

export function pagseguroConfigurado(): boolean {
  const e = getEnv();
  return Boolean(e.token);
}

// Tipos basicos pra checkout
export type CheckoutItem = {
  referenceId: string;
  name: string;
  quantity: number;
  unitAmountCentavos: number;
};

export type Comprador = {
  nome: string;
  email: string;
  cnpjOuCpf?: string; // 14 dig CNPJ ou 11 dig CPF, sem mascara
  telefone?: string;  // formato internacional sem +, ex: "5579999999999"
};

export type CriarCheckoutResult =
  | {
      ok: true;
      id: string;            // CHEC_xxx do PagSeguro
      payUrl: string;        // url pra redirecionar admin
      payload: unknown;      // resposta completa
    }
  | {
      ok: false;
      detalhe: string;
      payload?: unknown;
    };

export async function criarCheckout(input: {
  pagamentoId: string;        // nosso UUID pra rastrear no webhook
  valorCentavos: number;
  comprador: Comprador;
  redirectUrl: string;
  notificationUrl: string;
}): Promise<CriarCheckoutResult> {
  if (!pagseguroConfigurado()) {
    return { ok: false, detalhe: "PAGSEGURO_TOKEN nao configurado" };
  }

  const env = getEnv();
  const baseUrl = ENDPOINTS[env.ambiente];

  const item: CheckoutItem = {
    referenceId: input.pagamentoId,
    name: "Recarga de creditos — Melhores do Ano",
    quantity: 1,
    unitAmountCentavos: input.valorCentavos,
  };

  // Expira em 7 dias (Pix; cartao nao usa expiracao)
  const expiraEm = new Date(Date.now() + 7 * 86_400_000).toISOString();

  const body: Record<string, unknown> = {
    reference_id: input.pagamentoId,
    expiration_date: expiraEm,
    customer: {
      name: input.comprador.nome,
      email: input.comprador.email,
      ...(input.comprador.cnpjOuCpf
        ? { tax_id: input.comprador.cnpjOuCpf }
        : {}),
      ...(input.comprador.telefone
        ? {
            phones: [
              {
                country: "55",
                area: input.comprador.telefone.slice(2, 4),
                number: input.comprador.telefone.slice(4),
                type: "MOBILE",
              },
            ],
          }
        : {}),
    },
    items: [
      {
        reference_id: item.referenceId,
        name: item.name,
        quantity: item.quantity,
        unit_amount: item.unitAmountCentavos,
      },
    ],
    payment_methods: [
      { type: "CREDIT_CARD" },
      { type: "PIX" },
    ],
    redirect_url: input.redirectUrl,
    return_url: input.redirectUrl,
    notification_urls: [input.notificationUrl],
  };

  try {
    const res = await axios.post(`${baseUrl}/checkouts`, body, {
      headers: {
        Authorization: `Bearer ${env.token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 15000,
    });

    const id = res.data?.id;
    const links = (res.data?.links ?? []) as { rel: string; href: string }[];
    const payLink = links.find(
      (l) => l.rel === "PAY" || l.rel === "PAYMENT_URL"
    );

    if (!id || !payLink) {
      return {
        ok: false,
        detalhe: "PagSeguro nao retornou link de pagamento",
        payload: res.data,
      };
    }
    return { ok: true, id, payUrl: payLink.href, payload: res.data };
  } catch (err) {
    return { ok: false, detalhe: extrairErroPS(err), payload: extrairPayloadErro(err) };
  }
}

// Consulta o status atual de uma cobranca (usado em verificacao manual).
export async function consultarOrder(orderId: string): Promise<{
  status: string | null;
  payload: unknown;
}> {
  const env = getEnv();
  const baseUrl = ENDPOINTS[env.ambiente];
  try {
    const res = await axios.get(`${baseUrl}/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${env.token}`,
        Accept: "application/json",
      },
      timeout: 10000,
    });
    const charges = (res.data?.charges ?? []) as { status?: string }[];
    return {
      status: charges[0]?.status ?? null,
      payload: res.data,
    };
  } catch (err) {
    return { status: null, payload: { erro: extrairErroPS(err) } };
  }
}

function extrairErroPS(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{
      error_messages?: { description?: string; code?: string }[];
    }>;
    const msgs = ax.response?.data?.error_messages;
    if (msgs && msgs.length > 0) {
      return msgs.map((m) => `[${m.code ?? "?"}] ${m.description ?? "?"}`).join("; ");
    }
    return `${ax.response?.status ?? ""} ${ax.message}`.trim();
  }
  return err instanceof Error ? err.message : "erro desconhecido";
}

function extrairPayloadErro(err: unknown): unknown {
  if (axios.isAxiosError(err)) return err.response?.data ?? err.message;
  return err instanceof Error ? err.message : err;
}
