import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { CandidatosManager } from "./CandidatosManager";

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

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cdl-blue">Candidatos</h1>
        <p className="text-muted mt-1">Importe via CSV ou cadastre manualmente</p>
      </header>

      <CandidatosManager subcategorias={(subs ?? []) as unknown as { id: string; nome: string; categoria: { nome: string } }[]} />
    </div>
  );
}
