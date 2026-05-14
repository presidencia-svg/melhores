import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";

// Le do app_config do tenant atual se a sugestao publica de candidato
// (botao "Sugerir" no /votar) esta ligada. Default: ligadas.
//
// Em request context resolve tenant via host. Em background passe tenantId.
export async function isSugestoesPublicasLigadas(tenantId?: string): Promise<boolean> {
  const id = tenantId ?? (await getCurrentTenant()).id;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("app_config")
    .select("valor")
    .eq("tenant_id", id)
    .eq("chave", "sugestoes_publicas")
    .maybeSingle();
  return (data?.valor ?? "ligadas") !== "desligadas";
}
