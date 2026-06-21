import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";

// 3 modos de sugestao publica de candidato (chave app_config:
// "sugestoes_publicas"):
//
//   - "livre":      votante sugere e o candidato entra JA APROVADO
//                   (default historico, equivalente ao "ligadas" antigo)
//   - "aprovacao":  votante sugere e o candidato entra como "pendente";
//                   admin precisa liberar em /admin/sugestoes pra
//                   aparecer na votacao
//   - "desligadas": botao "Sugerir" some da tela de votacao
//
// Compat: valores antigos "ligadas" sao tratados como "livre".
export type ModoSugestoes = "livre" | "aprovacao" | "desligadas";

const PADRAO: ModoSugestoes = "livre";

function normalizar(valor: string | undefined | null): ModoSugestoes {
  if (valor === "desligadas") return "desligadas";
  if (valor === "aprovacao") return "aprovacao";
  // "livre", "ligadas" (legacy) ou qualquer outro → padrao livre
  return "livre";
}

export async function getModoSugestoes(
  tenantId?: string
): Promise<ModoSugestoes> {
  const id = tenantId ?? (await getCurrentTenant()).id;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("app_config")
    .select("valor")
    .eq("tenant_id", id)
    .eq("chave", "sugestoes_publicas")
    .maybeSingle();
  return normalizar(data?.valor ?? PADRAO);
}

// Compat: consumers antigos que so' querem saber se o botao aparece
// pro votante. Tanto "livre" quanto "aprovacao" deixam o botao visivel
// — so' "desligadas" oculta.
export async function isSugestoesPublicasLigadas(
  tenantId?: string
): Promise<boolean> {
  const modo = await getModoSugestoes(tenantId);
  return modo !== "desligadas";
}
