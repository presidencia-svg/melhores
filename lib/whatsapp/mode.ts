import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Le do app_config se a validacao WhatsApp (OTP) esta ligada.
// Default: ligada. Admin pode desligar via /admin quando ha problema de
// pagamento na Meta ou bloqueio do WABA.
export async function isWhatsAppValidacaoLigada(): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("app_config")
    .select("valor")
    .eq("chave", "whatsapp_validacao")
    .maybeSingle();
  return (data?.valor ?? "ligada") !== "desligada";
}
