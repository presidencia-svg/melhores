import { generateSecret, generateURI, verifySync } from "otplib";
import type { Tenant } from "@/lib/tenant/types";

const LABEL_PADRAO = "Painel Admin";

// Resolve o secret TOTP pro tenant.
//   - Se tenant.admin_totp_secret existir → usa esse.
//   - Senao, fallback pra env ADMIN_TOTP_SECRET so' pro tenant legacy
//     (CDL Aracaju, slug 'aracaju'). Tenants novos via signup nao herdam
//     TOTP do env — eles ativam manualmente em /admin/seguranca.
function getSecretParaTenant(tenant: Tenant): string | null {
  const fromTenant = tenant.admin_totp_secret;
  if (fromTenant && fromTenant.length >= 16) return fromTenant;
  if (tenant.slug !== "aracaju") return null;
  const fromEnv = process.env.ADMIN_TOTP_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  return null;
}

export function tenantTemTotp(tenant: Tenant): boolean {
  return getSecretParaTenant(tenant) !== null;
}

export function verifyTotpParaTenant(code: string, tenant: Tenant): boolean {
  const secret = getSecretParaTenant(tenant);
  if (!secret) return true; // 2FA desabilitado pra esse tenant
  if (!/^\d{6}$/.test(code)) return false;
  try {
    const result = verifySync({
      token: code,
      secret,
      epochTolerance: 30,
    });
    return result.valid === true;
  } catch {
    return false;
  }
}

// Gera novo secret + otpauth URI pra exibir QR Code no setup do tenant.
// Issuer/label sao construidos a partir do nome do tenant pra aparecer
// corretamente no Google Authenticator de cada CDL.
export function generateNewSecret(tenant: Tenant): {
  secret: string;
  otpauthUrl: string;
} {
  const secret = generateSecret();
  const issuer = tenant.nome;
  const label = `${LABEL_PADRAO} · ${tenant.nome}`;
  const otpauthUrl = generateURI({
    issuer,
    label,
    secret,
  });
  return { secret, otpauthUrl };
}
