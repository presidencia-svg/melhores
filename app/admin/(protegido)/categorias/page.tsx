import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { CategoriasManager } from "./CategoriasManager";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";

export default async function CategoriasAdminPage() {
  const tenant = await getCurrentTenant();
  const status = await getEdicaoStatus(tenant.id);
  if (status.status === "sem_edicao") {
    return <div className="p-8 text-red-600">Crie uma edição ativa primeiro.</div>;
  }
  const edicao = status.edicao;
  const supabase = createSupabaseAdminClient();

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
