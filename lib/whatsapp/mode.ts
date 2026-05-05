import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";

// Le do app_config do tenant atual se a validacao WhatsApp (OTP) esta ligada.
// Default: ligada. Admin pode desligar via /admin quando ha problema de
// pagamento na Meta ou bloqueio do WABA.
//
// Em request context resolve tenant via host. Em background passe tenantId.
export async function isWhatsAppValidacaoLigada(tenantId?: string): Promise<boolean> {
  const id = tenantId ?? (await getCurrentTenant()).id;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("app_config")
    .select("valor")
    .eq("tenant_id", id)
    .eq("chave", "whatsapp_validacao")
    .maybeSingle();
  return (data?.valor ?? "ligada") !== "desligada";
}
