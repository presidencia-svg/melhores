import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { SugestoesManager } from "./SugestoesManager";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";

export default async function SugestoesPage() {
  const tenant = await getCurrentTenant();
  const status = await getEdicaoStatus(tenant.id);
  if (status.status === "sem_edicao") {
    return <div className="p-8 text-red-600">Crie uma edição ativa primeiro.</div>;
  }
  const supabase = createSupabaseAdminClient();

  const { data: pendentes } = await supabase
    .from("candidatos")
    .select("id, nome, sugestoes_count, criado_em, subcategoria:subcategorias!inner(nome, categoria:categorias!inner(nome))")
    .eq("edicao_id", status.edicao.id)
    .eq("status", "pendente")
    .order("sugestoes_count", { ascending: false })
    .limit(200);

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cdl-blue">Sugestões pendentes</h1>
        <p className="text-muted mt-1">Aprove ou marque como duplicata.</p>
      </header>

      <SugestoesManager
        sugestoes={(pendentes ?? []) as unknown as Array<{
          id: string;
          nome: string;
          sugestoes_count: number;
          criado_em: string;
          subcategoria: { nome: string; categoria: { nome: string } };
        }>}
      />
    </div>
  );
}
