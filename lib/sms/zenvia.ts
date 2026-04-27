import axios from "axios";

export type SmsResult = {
  ok: boolean;
  detalhe?: string;
  raw?: unknown;
};

function normalizePhone(value: string): string {
  // Zenvia espera E.164 sem o "+", ex: 5579999999999
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

export function zenviaConfigurada(): boolean {
  return Boolean(process.env.ZENVIA_API_TOKEN && process.env.ZENVIA_FROM);
}

export async function enviarSmsZenvia(numero: string, texto: string): Promise<SmsResult> {
  const token = process.env.ZENVIA_API_TOKEN;
  const from = process.env.ZENVIA_FROM;
  if (!token || !from) {
    return { ok: false, detalhe: "ZENVIA_API_TOKEN ou ZENVIA_FROM não configurados" };
  }
  try {
    const { data } = await axios.post(
      "https://api.zenvia.com/v2/channels/sms/messages",
      {
        from,
        to: normalizePhone(numero),
        contents: [{ type: "text", text: texto }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-TOKEN": token,
        },
        timeout: 10000,
      }
    );
    return { ok: true, raw: data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "erro desconhecido";
    return { ok: false, detalhe: message };
  }
}
