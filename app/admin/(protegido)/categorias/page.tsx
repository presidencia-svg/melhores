import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { CategoriasManager } from "./CategoriasManager";

export default async function CategoriasAdminPage() {
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

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nome, slug, descricao, ordem, ativa, subcategorias(id, nome, slug, ordem, ativa)")
    .eq("edicao_id", edicao.id)
    .order("nome");

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cdl-blue">Categorias</h1>
        <p className="text-muted mt-1">{edicao.nome}</p>
      </header>

      <CategoriasManager edicaoId={edicao.id} categorias={categorias ?? []} />
    </div>
  );
}
