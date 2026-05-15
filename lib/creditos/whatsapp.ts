import { debitarCredito, creditarCredito, PRECOS } from "./index";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Helper pra cobrar/estornar 1 disparo de OTP por WhatsApp.
// Tenant CDL Aracaju ('aracaju') nao e' cobrado (e' o dono da plataforma).
//
// Padrao de uso: chama `debitarOtpWhatsApp` ANTES de tentar enviar; se nenhum
// canal de envio funcionar, chama `estornarOtpWhatsApp` pra devolver o
// credito. Evita o tenant pagar por mensagem que nunca chegou.

async function getTenantSlug(tenantId: string): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("tenants")
    .select("slug")
    .eq("id", tenantId)
    .maybeSingle();
  return data?.slug ?? null;
}

export async function debitarOtpWhatsApp(
  tenantId: string,
  edicaoId?: string
): Promise<{ ok: true; cobrado: boolean } | { ok: false; motivo: string }> {
  const slug = await getTenantSlug(tenantId);
  if (slug === "aracaju") {
    return { ok: true, cobrado: false };
  }
  const r = await debitarCredito({
    tenantId,
    motivo: "whatsapp_confirmacao",
    descricao: "Envio de código WhatsApp (OTP)",
    edicaoId,
  });
  if (!r.ok) {
    return { ok: false, motivo: r.motivo };
  }
  return { ok: true, cobrado: true };
}

export async function estornarOtpWhatsApp(tenantId: string): Promise<void> {
  const slug = await getTenantSlug(tenantId);
  if (slug === "aracaju") return;
  try {
    await creditarCredito({
      tenantId,
      valorCentavos: PRECOS.whatsapp_confirmacao,
      motivo: "estorno",
      descricao: "Estorno OTP WhatsApp (envio falhou)",
    });
  } catch (e) {
    console.error("[whatsapp] estorno OTP falhou:", e);
  }
}
