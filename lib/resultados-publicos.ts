import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type EdicaoPublica = { id: string; ano: number; nome: string };

// Edicoes cujo resultado pode aparecer no site: liberadas pela CDL
// (resultado_publico) e com a votacao ja encerrada.
export async function listarEdicoesComResultado(
  tenantId: string
): Promise<EdicaoPublica[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("edicao")
    .select("id, ano, nome")
    .eq("tenant_id", tenantId)
    .eq("resultado_publico", true)
    .lt("fim_votacao", new Date().toISOString())
    .order("ano", { ascending: false });
  return (data ?? []) as EdicaoPublica[];
}
