import axios from "axios";

export type ZapiSendResult = {
  ok: boolean;
  detalhe?: string;
  raw?: unknown;
};

function baseUrl(): string {
  const instance = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  if (!instance || !token) throw new Error("Z-API não configurada");
  return `https://api.z-api.io/instances/${instance}/token/${token}`;
}

function clientToken(): string {
  return process.env.ZAPI_CLIENT_TOKEN ?? "";
}

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

export async function enviarMensagemTexto(numero: string, mensagem: string): Promise<ZapiSendResult> {
  try {
    const phone = normalizePhone(numero);
    const { data } = await axios.post(
      `${baseUrl()}/send-text`,
      { phone, message: mensagem },
      {
        headers: {
          "Content-Type": "application/json",
          "Client-Token": clientToken(),
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

export function gerarCodigoVerificacao(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export type ZapiStatus = {
  conectado: boolean;
  detalhe?: string;
  raw?: unknown;
};

export async function verificarStatus(): Promise<ZapiStatus> {
  try {
    const { data } = await axios.get(`${baseUrl()}/status`, {
      headers: { "Client-Token": clientToken() },
      timeout: 8000,
    });
    // Z-API retorna { connected: bool, ... }
    const conectado = Boolean((data as { connected?: boolean })?.connected);
    return { conectado, raw: data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro desconhecido";
    return { conectado: false, detalhe: message };
  }
}
