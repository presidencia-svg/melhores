import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { verificarSenhaHash } from "@/lib/admin/password";
import { getCurrentTenant, tryGetCurrentTenant } from "@/lib/tenant/resolver";
import type { Tenant } from "@/lib/tenant/types";

const COOKIE = "mda_admin";
const MAX_AGE = 60 * 60 * 24; // 24h

function sign(value: string): string {
  const secret = process.env.JWT_SECRET ?? "fallback-dev-secret";
  return createHmac("sha256", secret).update(value).digest("hex");
}

// Comparacao plain pra fallback de env (CDL Aracaju enquanto nao migrou
// pra hash no banco). Constant-time pra mitigar timing attacks.
function senhaPlainEq(input: string, expected: string): boolean {
  if (!expected || expected.length < 6) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Verifica senha do admin pra um tenant especifico.
//   - Se tenant.admin_password_hash existir → scrypt verify.
//   - Senao, fallback pra env ADMIN_PASSWORD so' pro tenant legacy
//     (CDL Aracaju, slug 'aracaju'). Tenants novos sempre tem hash
//     setado no signup, entao esse fallback so' aplica pro tenant #1
//     antes da migracao pro hash via /admin/seguranca.
export async function senhaCorretaParaTenant(
  senha: string,
  tenant: Tenant
): Promise<boolean> {
  if (tenant.admin_password_hash) {
    return verificarSenhaHash(senha, tenant.admin_password_hash);
  }
  if (tenant.slug !== "aracaju") return false;
  return senhaPlainEq(senha, process.env.ADMIN_PASSWORD ?? "");
}

// Cookie format: "<tenantId>.<issuedAt>.<sig>"
// sig assina "<tenantId>:<issuedAt>".
function montarToken(tenantId: string, issuedAt: number): string {
  const payload = `${tenantId}:${issuedAt}`;
  return `${tenantId}.${issuedAt}.${sign(payload)}`;
}

function parseToken(
  token: string
): { tenantId: string; issuedAt: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [tenantId, issuedAtStr, signature] = parts as [string, string, string];
  if (!tenantId || !issuedAtStr || !signature) return null;
  const issuedAt = parseInt(issuedAtStr, 10);
  if (!Number.isFinite(issuedAt)) return null;
  const expected = sign(`${tenantId}:${issuedAtStr}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  if (Date.now() - issuedAt >= MAX_AGE * 1000) return null;
  return { tenantId, issuedAt };
}

export async function setAdminSession(tenantId: string): Promise<void> {
  const cookieStore = await cookies();
  const token = montarToken(tenantId, Date.now());
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

// Tenant ID do admin logado (qualquer tenant), ou null se sessao invalida.
// NAO valida que o tenant logado bate com o do request — pra isso use isAdmin().
export async function getAdminTenantId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  const parsed = parseToken(token);
  return parsed?.tenantId ?? null;
}

// Admin LOGADO E autorizado pro tenant do request atual.
// Retorna false se: (a) sem cookie, (b) cookie invalido/expirado, ou
// (c) tenant da sessao != tenant do host.
export async function isAdmin(): Promise<boolean> {
  const sessionTenantId = await getAdminTenantId();
  if (!sessionTenantId) return false;
  const tenant = await tryGetCurrentTenant();
  if (!tenant) return false;
  return tenant.id === sessionTenantId;
}

// Variante que retorna o tenant logado se tudo bater (util pra route
// handlers que ja vao usar tenant.id em queries).
export async function getAdminTenantOuNull(): Promise<Tenant | null> {
  const sessionTenantId = await getAdminTenantId();
  if (!sessionTenantId) return null;
  const tenant = await getCurrentTenant();
  if (tenant.id !== sessionTenantId) return null;
  return tenant;
}
