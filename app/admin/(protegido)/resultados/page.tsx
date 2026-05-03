import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ResultadosFiltrados } from "./ResultadosFiltrados";

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

export const revalidate = 30;

export default async function ResultadosPage() {
  const supabase = createSupabaseAdminClient();

  // Paginacao manual: PostgREST default trunca em 1000 linhas.
  const PAGE_SIZE = 1000;
  const rows: Resultado[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data } = await supabase
      .from("v_resultados_riscado")
      .select("*")
      .range(offset, offset + PAGE_SIZE - 1);
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
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cdl-blue">
          Resultados
        </h1>
        <p className="text-muted mt-1">
          {gruposOrdenados.length} subcategorias · atualizado a cada 30 segundos
        </p>
      </header>

      <ResultadosFiltrados grupos={gruposOrdenados} />
    </div>
  );
}
