import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";

export type SpcMode = "obrigatorio" | "desligado";

// Le o modo da consulta SPC do app_config do tenant atual.
// Default 'obrigatorio' — comportamento original (bloqueia cadastro se SPC falha).
// 'desligado' — pula SPC, usa nome digitado pelo proprio votante.
//
// Em request context, resolve tenant via host. Em background (cron, scripts),
// passe o tenantId explicito.
export async function getSpcMode(tenantId?: string): Promise<SpcMode> {
  const id = tenantId ?? (await getCurrentTenant()).id;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("app_config")
    .select("valor")
    .eq("tenant_id", id)
    .eq("chave", "spc_consulta")
    .maybeSingle();
  return data?.valor === "desligado" ? "desligado" : "obrigatorio";
}
