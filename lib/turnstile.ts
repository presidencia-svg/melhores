// Verifica token do Cloudflare Turnstile no servidor.
// Retorna { ok: true } se válido, ou { ok: false, errorCodes } se falhar.
// Se TURNSTILE_SECRET_KEY não estiver configurado, considera desativado (ok: true).

type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
};

export type TurnstileResult =
  | { ok: true; cached?: boolean; reason?: "disabled" }
  | { ok: false; errorCodes: string[] };

export async function verifyTurnstile(
  token: string | null | undefined,
  ip: string
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { ok: true, reason: "disabled" };
  }

  if (!token) {
    return { ok: false, errorCodes: ["missing-input-response"] };
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
      remoteip: ip,
    });

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      }
    );

    const data = (await res.json()) as TurnstileResponse;

    if (data.success) return { ok: true };

    const errorCodes = data["error-codes"] ?? ["unknown"];
    console.error("[turnstile] verification failed:", errorCodes, "hostname:", data.hostname);
    return { ok: false, errorCodes };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[turnstile] fetch failed:", message);
    return { ok: false, errorCodes: [`fetch-error:${message}`] };
  }
}
