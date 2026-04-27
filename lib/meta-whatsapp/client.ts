import axios from "axios";

export type MetaSendResult = {
  ok: boolean;
  detalhe?: string;
  raw?: unknown;
};

function getPhoneNumberIds(): string[] {
  const raw = process.env.META_WHATSAPP_PHONE_IDS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getToken(): string {
  return process.env.META_WHATSAPP_TOKEN ?? "";
}

function getApiVersion(): string {
  return process.env.META_API_VERSION ?? "v21.0";
}

export function metaConfigurada(): boolean {
  return getToken() !== "" && getPhoneNumberIds().length > 0;
}

// Round-robin global em memória — alterna o phone_id a cada envio.
// Se o processo reinicia, recomeça do 0; tudo bem.
let nextIdx = 0;

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

// Envia uma mensagem usando template aprovado da Meta.
// Tenta cada Phone Number ID em round-robin. Se um falhar (ex.: rate limit),
// passa pro próximo até esgotar.
export async function enviarTemplate(
  numero: string,
  templateName: string,
  language: string,
  bodyParams: string[]
): Promise<MetaSendResult> {
  const token = getToken();
  const ids = getPhoneNumberIds();
  if (!token) return { ok: false, detalhe: "META_WHATSAPP_TOKEN não configurado" };
  if (ids.length === 0)
    return { ok: false, detalhe: "META_WHATSAPP_PHONE_IDS vazio" };

  const to = normalizePhone(numero);
  const baseStart = nextIdx % ids.length;
  nextIdx++;

  let lastErr: string | undefined;
  for (let i = 0; i < ids.length; i++) {
    const phoneId = ids[(baseStart + i) % ids.length]!;
    try {
      const body: Record<string, unknown> = {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: language },
          components:
            bodyParams.length > 0
              ? [
                  {
                    type: "body",
                    parameters: bodyParams.map((text) => ({
                      type: "text",
                      text,
                    })),
                  },
                ]
              : [],
        },
      };

      const { data } = await axios.post(
        `https://graph.facebook.com/${getApiVersion()}/${phoneId}/messages`,
        body,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 12000,
        }
      );
      return { ok: true, raw: data };
    } catch (err: unknown) {
      const msg =
        // Tenta extrair erro detalhado da Meta API
        (axios.isAxiosError(err) &&
          (err.response?.data as { error?: { message?: string } } | undefined)
            ?.error?.message) ||
        (err instanceof Error ? err.message : "erro desconhecido");
      lastErr = `[${phoneId}] ${msg}`;
    }
  }
  return { ok: false, detalhe: lastErr ?? "todos os Phone Number IDs falharam" };
}

// Verifica saúde da configuração: tem token + ao menos um phone id, e os tokens funcionam.
// Retorna detalhes pra UI mostrar pro admin.
export async function verificarStatusMeta(): Promise<{
  configurada: boolean;
  conectada: boolean;
  detalhe?: string;
  phone_ids: string[];
}> {
  const ids = getPhoneNumberIds();
  const token = getToken();
  if (!token || ids.length === 0) {
    return { configurada: false, conectada: false, phone_ids: ids };
  }
  // Pinga o primeiro phone id pra ver se o token funciona
  try {
    await axios.get(
      `https://graph.facebook.com/${getApiVersion()}/${ids[0]}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 8000,
      }
    );
    return { configurada: true, conectada: true, phone_ids: ids };
  } catch (err) {
    const msg =
      (axios.isAxiosError(err) &&
        (err.response?.data as { error?: { message?: string } } | undefined)
          ?.error?.message) ||
      (err instanceof Error ? err.message : "erro desconhecido");
    return {
      configurada: true,
      conectada: false,
      detalhe: msg,
      phone_ids: ids,
    };
  }
}
