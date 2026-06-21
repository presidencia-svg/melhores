import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  ORDEM_NIVEIS,
  type Patrocinador,
} from "@/lib/patrocinadores/types";

// Re-exports pros consumers que ja importavam tudo de "@/lib/patrocinadores".
// Tipos/labels/helpers puros estao em ./patrocinadores/types — esse arquivo
// existe so' pra encapsular a query (depende de next/headers via
// createSupabaseAdminClient, entao NAO pode ser importado de
// "use client" components).
export {
  ORDEM_NIVEIS,
  LABEL_NIVEIS,
  COTAS,
  agruparPorNivel,
  type NivelPatrocinio,
  type Patrocinador,
} from "@/lib/patrocinadores/types";

// Busca patrocinadores ativos da edicao, ja' ordenados (master primeiro,
// depois ouro, etc, com desempate por ordem e nome).
export async function listarPatrocinadores(
  edicaoId: string
): Promise<Patrocinador[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("patrocinadores")
    .select("id, nome, logo_url, link, nivel, ordem")
    .eq("edicao_id", edicaoId)
    .eq("ativo", true);
  const lista = (data ?? []) as Patrocinador[];
  return lista.sort((a, b) => {
    const niA = ORDEM_NIVEIS.indexOf(a.nivel);
    const niB = ORDEM_NIVEIS.indexOf(b.nivel);
    if (niA !== niB) return niA - niB;
    if (a.ordem !== b.ordem) return a.ordem - b.ordem;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
}
