import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ResultadosFiltrados } from "./ResultadosFiltrados";
import { AtualizarBtn } from "../AtualizarBtn";

type Resultado = {
  candidato_id: string;
  candidato_nome: string;
  origem: string;
  subcategoria_id: string;
  subcategoria_nome: string;
  categoria_id: string;
  categoria_nome: string;
  total_votos: number;
  pct_spc?: number | null;
  pct_wa?: number | null;
  pct_selfie?: number | null;
  pct_fp_comp?: number | null;
  pct_ip_comp?: number | null;
  score_risco?: number | null;
};

// 1h: pos-eleicao os resultados sao imutaveis. Botao "Atualizar" no header
// invalida o cache na hora caso precise (ex: depois de mesclagem de candidatos).
export const revalidate = 3600;

export default async function ResultadosPage() {
  const supabase = createSupabaseAdminClient();

  // Paginacao manual: PostgREST default trunca em 1000 linhas.
  // Tenta a view com risco; se nao existir (migration 024 nao rodada),
  // cai pra v_resultados pura — score_risco fica null e o badge nao aparece.
  const PAGE_SIZE = 1000;
  const rows: Resultado[] = [];
  let viewName: "v_resultados_riscado" | "v_resultados" = "v_resultados_riscado";
  let viewWarning: string | null = null;

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(viewName)
      .select("*")
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      console.error(`[resultados] erro ao consultar ${viewName}:`, error);
      if (viewName === "v_resultados_riscado") {
        viewWarning = `View v_resultados_riscado nao encontrada — rode a migration 024. Erro: ${error.message}`;
        viewName = "v_resultados";
        offset = -PAGE_SIZE; // proximo loop comeca em offset 0
        continue;
      }
      break;
    }
    if (!data || data.length === 0) break;
    rows.push(...(data as Resultado[]));
    if (data.length < PAGE_SIZE) break;
  }

  const grupos = new Map<
    string,
    { categoria: string; subcategoria: string; candidatos: Resultado[] }
  >();
  for (const r of rows) {
    const key = `${r.categoria_nome}|${r.subcategoria_nome}`;
    if (!grupos.has(key)) {
      grupos.set(key, {
        categoria: r.categoria_nome,
        subcategoria: r.subcategoria_nome,
        candidatos: [],
      });
    }
    grupos.get(key)!.candidatos.push(r);
  }

  for (const g of grupos.values()) {
    g.candidatos.sort((a, b) => b.total_votos - a.total_votos);
  }

  const gruposOrdenados = Array.from(grupos.values()).sort((a, b) => {
    const c = a.categoria.localeCompare(b.categoria, "pt-BR");
    return c !== 0 ? c : a.subcategoria.localeCompare(b.subcategoria, "pt-BR");
  });

  return (
    <div className="p-8">
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-cdl-blue">
            Resultados
          </h1>
          <p className="text-muted mt-1">
            {gruposOrdenados.length} subcategorias · cache de 1h (use "Atualizar" pra forçar)
          </p>
          {viewWarning && (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <strong>Aviso:</strong> {viewWarning}
            </div>
          )}
        </div>
        <AtualizarBtn path="/admin/resultados" />
      </header>

      <ResultadosFiltrados grupos={gruposOrdenados} />
    </div>
  );
}
