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

  // Pega top1 de cada subcategoria (com pelo menos 1 voto) + nome da
  // categoria pai pra agrupar e ordenar a lista. v_podium ja traz top1_nome.
  const [{ data: podiums }, { data: subcatMapping }] = await Promise.all([
    supabase
      .from("v_podium")
      .select("subcategoria_id, subcategoria_nome, top1_nome, top1_votos")
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
    top1_nome: string;
    top1_votos: number;
  };

  const linhas = (podiums ?? []) as PodiumRow[];
  const total = linhas.length;
  const vencedores: Vencedor[] = linhas.map((p, idx) => ({
    subcategoria_id: p.subcategoria_id,
    vencedor: p.top1_nome,
    categoria: p.subcategoria_nome,
    grupo: catBySubId.get(p.subcategoria_id) ?? "Outras",
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
