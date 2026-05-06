import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { CandidatosManager } from "./CandidatosManager";
import { CandidatosLista } from "./CandidatosLista";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";

export default async function CandidatosAdminPage() {
  const tenant = await getCurrentTenant();
  const status = await getEdicaoStatus(tenant.id);
  if (status.status === "sem_edicao") {
    return <div className="p-8 text-red-600">Crie uma edição ativa primeiro.</div>;
  }
  const edicao = status.edicao;
  const supabase = createSupabaseAdminClient();

  const { data: subs } = await supabase
    .from("subcategorias")
    .select("id, nome, categoria:categorias!inner(nome)")
    .eq("edicao_id", edicao.id)
    .order("nome");

  // Lista plana pra usar no Mover (id + label "Categoria → Subcategoria")
  const subsFlat = (subs ?? [])
    .map((s) => ({
      id: s.id,
      nome: s.nome,
      categoria: (s as unknown as { categoria: { nome: string } }).categoria.nome,
    }))
    .sort((a, b) => {
      const c = a.categoria.localeCompare(b.categoria, "pt-BR");
      return c !== 0 ? c : a.nome.localeCompare(b.nome, "pt-BR");
    });

  // Pagina manual pra contornar o limite default de 1000 do PostgREST.
  // Com 1.000+ candidatos, sem isso o admin so via os primeiros 1k.
  const PAGE_SIZE = 1000;
  const SELECT_COLS =
    "id, nome, descricao, foto_url, origem, status, sugestoes_count, subcategoria:subcategorias!inner(id, nome, categoria:categorias!inner(nome))";
  const candidatos: NonNullable<Awaited<ReturnType<typeof carregar>>> = [];
  async function carregar(offset: number) {
    return (
      await supabase
        .from("candidatos")
        .select(SELECT_COLS)
        .eq("edicao_id", edicao.id)
        .neq("status", "rejeitado")
        // Ordenacao tem que ser ESTAVEL — com so .order("nome"), candidatos
        // com mesmo nome (ex: 3 Bruno Moraes) ficam em ordem indefinida
        // entre paginas, fazendo um aparecer em 2 paginas e outro sumir.
        // O id como tie-breaker garante que cada linha apareca exatamente
        // uma vez no array final.
        .order("nome")
        .order("id")
        .range(offset, offset + PAGE_SIZE - 1)
    ).data;
  }
  // Dedup defensivo por id — se algum lote ainda conseguir trazer duplicata
  // (driver, race, etc), nao deixa chegar na UI.
  const visto = new Set<string>();
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const lote = await carregar(offset);
    if (!lote || lote.length === 0) break;
    for (const c of lote) {
      if (!visto.has(c.id)) {
        visto.add(c.id);
        candidatos.push(c);
      }
    }
    if (lote.length < PAGE_SIZE) break;
  }

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cdl-blue">Candidatos</h1>
        <p className="text-muted mt-1">{candidatos.length} candidatos · importe via CSV ou gerencie abaixo</p>
      </header>

      <CandidatosManager
        subcategorias={
          [...((subs ?? []) as unknown as { id: string; nome: string; categoria: { nome: string } }[])].sort((a, b) => {
            const c = a.categoria.nome.localeCompare(b.categoria.nome, "pt-BR");
            return c !== 0 ? c : a.nome.localeCompare(b.nome, "pt-BR");
          })
        }
      />

      <div className="mt-8">
        <CandidatosLista
          candidatos={candidatos as unknown as Array<{
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
