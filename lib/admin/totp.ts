import { generateSecret, generateURI, verifySync } from "otplib";

const SECRET = process.env.ADMIN_TOTP_SECRET;
const ISSUER = "CDL Aracaju";
const LABEL = "Melhores do Ano · Painel Admin";

export function isTotpEnabled(): boolean {
  return Boolean(SECRET && SECRET.length >= 16);
}

export function verifyTotpCode(code: string): boolean {
  if (!isTotpEnabled()) return true;
  if (!/^\d{6}$/.test(code)) return false;
  try {
    const result = verifySync({
      token: code,
      secret: SECRET!,
      epochTolerance: 30,
    });
    return result.valid === true;
  } catch {
    return false;
  }
}

export function generateNewSecret(): { secret: string; otpauthUrl: string } {
  const secret = generateSecret();
  const otpauthUrl = generateURI({
    issuer: ISSUER,
    label: LABEL,
    secret,
  });
  return { secret, otpauthUrl };
}
