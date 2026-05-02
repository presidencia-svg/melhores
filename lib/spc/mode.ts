import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type SpcMode = "obrigatorio" | "desligado";

// Le o modo da consulta SPC do app_config.
// Default 'obrigatorio' — comportamento original (bloqueia cadastro se SPC falha).
// 'desligado' — pula SPC, usa nome digitado pelo proprio votante.
export async function getSpcMode(): Promise<SpcMode> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("app_config")
    .select("valor")
    .eq("chave", "spc_consulta")
    .maybeSingle();
  return data?.valor === "desligado" ? "desligado" : "obrigatorio";
}
