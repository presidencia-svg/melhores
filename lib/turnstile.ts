// Verifica token do Cloudflare Turnstile no servidor.
// Retorna true se token válido, false caso contrário.
// Se TURNSTILE_SECRET_KEY não estiver configurado, retorna true (modo desativado).

type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
};

export async function verifyTurnstile(token: string | null | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // desativado

  if (!token) return false;

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
      remoteip: ip,
    });

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = (await res.json()) as TurnstileResponse;
    return data.success === true;
  } catch {
    return false;
  }
}
