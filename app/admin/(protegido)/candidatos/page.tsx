import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { CandidatosManager } from "./CandidatosManager";
import { CandidatosLista } from "./CandidatosLista";

export default async function CandidatosAdminPage() {
  const supabase = createSupabaseAdminClient();
  const { data: edicao } = await supabase
    .from("edicao")
    .select("id, ano, nome")
    .eq("ativa", true)
    .order("ano", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!edicao) {
    return <div className="p-8 text-red-600">Crie uma edição ativa primeiro.</div>;
  }

  const { data: subs } = await supabase
    .from("subcategorias")
    .select("id, nome, categoria:categorias!inner(nome, edicao_id)")
    .eq("categoria.edicao_id", edicao.id)
    .order("nome");

  // Lista plana pra usar no Mover (id + label "Categoria → Subcategoria")
  const subsFlat = (subs ?? []).map((s) => ({
    id: s.id,
    nome: s.nome,
    categoria: (s as unknown as { categoria: { nome: string } }).categoria.nome,
  }));

  const { data: candidatos } = await supabase
    .from("candidatos")
    .select("id, nome, descricao, foto_url, origem, status, sugestoes_count, subcategoria:subcategorias!inner(id, nome, categoria:categorias!inner(nome, edicao_id))")
    .eq("subcategoria.categoria.edicao_id", edicao.id)
    .neq("status", "rejeitado")
    .order("nome");

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cdl-blue">Candidatos</h1>
        <p className="text-muted mt-1">{(candidatos ?? []).length} candidatos · importe via CSV ou gerencie abaixo</p>
      </header>

      <CandidatosManager subcategorias={(subs ?? []) as unknown as { id: string; nome: string; categoria: { nome: string } }[]} />

      <div className="mt-8">
        <CandidatosLista
          candidatos={(candidatos ?? []) as unknown as Array<{
            id: string;
            nome: string;
            descricao: string | null;
            foto_url: string | null;
            origem: string;
            status: string;
            sugestoes_count: number;
            subcategoria: { id: string; nome: string; categoria: { nome: string } };
          }>}
          todasSubcategorias={subsFlat}
        />
      </div>
    </div>
  );
}
