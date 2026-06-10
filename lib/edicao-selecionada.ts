import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getEdicaoStatus, type Edicao } from "@/lib/edicao-status";

// Resolve qual edicao a pagina admin deve mostrar:
//   - Se a URL passar ?edicao=<uuid> E essa edicao pertencer ao tenant
//     logado, retorna essa edicao (modo "historico").
//   - Caso contrario, retorna a edicao ATIVA do tenant (modo padrao).
//   - Se nao tiver nenhuma edicao no tenant, retorna null.
//
// Usar nas paginas admin que precisam suportar navegacao entre edicoes
// (dashboard, resultados, podio, votantes, whatsapp/insights).
//
// Cross-tenant safe: NUNCA retorna edicao de outro tenant — antes de
// aceitar o UUID da URL, valida tenant_id no banco.
export async function getEdicaoSelecionada(
  tenantId: string,
  edicaoIdQuery: string | string[] | undefined
): Promise<{ edicao: Edicao; isHistorico: boolean } | null> {
  const queryId = Array.isArray(edicaoIdQuery)
    ? edicaoIdQuery[0]
    : edicaoIdQuery;

  if (queryId && /^[0-9a-f-]{36}$/i.test(queryId)) {
    const supabase = createSupabaseAdminClient();
    const { data: edicao } = await supabase
      .from("edicao")
      .select(
        "id, tenant_id, ano, nome, inicio_votacao, fim_votacao, divulgacao_resultado, ativa"
      )
      .eq("id", queryId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (edicao) {
      return { edicao: edicao as Edicao, isHistorico: !edicao.ativa };
    }
  }

  const status = await getEdicaoStatus(tenantId);
  if (status.status === "sem_edicao") return null;
  return { edicao: status.edicao, isHistorico: false };
}
