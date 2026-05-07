import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

// Super-admin auth — separado da auth de tenant. Usado pra acessar
// melhoresdoano.app.br/super (lista de clientes, cortesia de credito,
// bloqueio manual).
//
// Auth e' baseado em env var (SUPER_ADMIN_PASSWORD), nao em DB. Apenas
// 1 super-admin operando a plataforma. Se quiser multiplo no futuro,
// migrar pra tabela tipo super_admins (email, password_hash).

const COOKIE = "mda_super";
const MAX_AGE = 60 * 60 * 8; // 8h (mais curto que admin de tenant)

function sign(value: string): string {
  const secret = process.env.JWT_SECRET ?? "fallback-dev-secret";
  return createHmac("sha256", secret).update(`super:${value}`).digest("hex");
}

export function senhaSuperCorreta(input: string): boolean {
  const expected = process.env.SUPER_ADMIN_PASSWORD ?? "";
  if (!expected || expected.length < 8) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function setSuperSession(): Promise<void> {
  const cookieStore = await cookies();
  const issuedAt = Date.now().toString();
  const token = `${issuedAt}.${sign(issuedAt)}`;
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSuperSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

export async function isSuperAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return false;
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;
  const expectedSig = sign(issuedAt);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;
  const ageMs = Date.now() - parseInt(issuedAt, 10);
  return ageMs < MAX_AGE * 1000;
}
