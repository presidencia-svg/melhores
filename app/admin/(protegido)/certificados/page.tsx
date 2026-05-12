import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Award } from "lucide-react";
import { CertificadosLista, type Vencedor } from "./CertificadosLista";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { montarBranding } from "@/lib/tenant/branding";

// 1h: pos-eleicao a lista de vencedores e' imutavel.
export const revalidate = 3600;

export default async function CertificadosPage() {
  const tenant = await getCurrentTenant();
  const edicaoStatus = await getEdicaoStatus(tenant.id);
  const edicao =
    edicaoStatus.status !== "sem_edicao" ? edicaoStatus.edicao : null;
  const branding = montarBranding(tenant, edicao);

  const supabase = createSupabaseAdminClient();

  // Pega top1 + top2 de cada subcategoria (com pelo menos 1 voto). Quando
  // top1_votos == top2_votos houve empate tecnico — geramos 1 certificado
  // pra cada co-campeao. v_podium ordena top1/top2 alfabeticamente no empate.
  const [{ data: podiums }, { data: subcatMapping }] = await Promise.all([
    supabase
      .from("v_podium")
      .select(
        "subcategoria_id, subcategoria_nome, top1_id, top1_nome, top1_votos, top2_id, top2_nome, top2_votos"
      )
      .eq("edicao_id", edicao?.id ?? "")
      .gt("top1_votos", 0)
      .order("subcategoria_nome", { ascending: true }),
    supabase
      .from("subcategorias")
      .select("id, categoria:categorias(id, nome)")
      .eq("edicao_id", edicao?.id ?? ""),
  ]);

  type SubcatRow = {
    id: string;
    categoria:
      | { id: string; nome: string }
      | { id: string; nome: string }[]
      | null;
  };
  const catBySubId = new Map<string, string>();
  for (const row of (subcatMapping ?? []) as SubcatRow[]) {
    const cat = Array.isArray(row.categoria) ? row.categoria[0] : row.categoria;
    if (cat?.nome) catBySubId.set(row.id, cat.nome);
  }

  type PodiumRow = {
    subcategoria_id: string;
    subcategoria_nome: string;
    top1_id: string;
    top1_nome: string;
    top1_votos: number;
    top2_id: string | null;
    top2_nome: string | null;
    top2_votos: number;
  };

  const linhas = (podiums ?? []) as PodiumRow[];

  // Expansao: 1 cert por linha normalmente, 2 certs quando ha empate
  // tecnico de 1o lugar (top1_votos === top2_votos com top2 valido).
  type PreExpand = {
    subcategoria_id: string;
    vencedor: string;
    categoria: string;
    grupo: string;
  };
  const expandidos: PreExpand[] = [];
  for (const p of linhas) {
    const grupo = catBySubId.get(p.subcategoria_id) ?? "Outras";
    expandidos.push({
      subcategoria_id: p.top1_id,
      vencedor: p.top1_nome,
      categoria: p.subcategoria_nome,
      grupo,
    });
    if (p.top2_id && p.top2_nome && p.top2_votos === p.top1_votos) {
      expandidos.push({
        subcategoria_id: p.top2_id,
        vencedor: p.top2_nome,
        categoria: p.subcategoria_nome,
        grupo,
      });
    }
  }

  const total = expandidos.length;
  const vencedores: Vencedor[] = expandidos.map((e, idx) => ({
    subcategoria_id: e.subcategoria_id,
    vencedor: e.vencedor,
    categoria: e.categoria,
    grupo: e.grupo,
    numero: `Nº ${String(idx + 1).padStart(3, "0")} / ${String(total).padStart(3, "0")}`,
  }));

  return (
    <div className="p-8 space-y-6 print:p-0 print:space-y-0">
      <header className="flex items-start justify-between gap-4 flex-wrap print:hidden">
        <div>
          <h1 className="font-display text-3xl font-bold text-cdl-blue flex items-center gap-2">
            <Award className="w-7 h-7 text-cdl-yellow-dark" />
            Certificados de Premiação
          </h1>
          <p className="text-muted mt-1">
            Escolha um modelo, o sistema preenche automaticamente com o 1º
            colocado de cada subcategoria e gera 1 PDF carta paisagem alta
            qualidade pronto para a gráfica.
          </p>
        </div>
      </header>

      {vencedores.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted py-12 text-center">
              Sem vencedores ainda — feche a votação primeiro.
            </p>
          </CardContent>
        </Card>
      ) : (
        <CertificadosLista vencedores={vencedores} branding={branding} />
      )}
    </div>
  );
}
