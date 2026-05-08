import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { MailOpen } from "lucide-react";
import { ConvitesLista, type Vencedor } from "./ConvitesLista";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { montarBranding } from "@/lib/tenant/branding";

// Pos-eleicao a lista nao muda. 1h cache.
export const revalidate = 3600;

export default async function ConvitesPage() {
  const tenant = await getCurrentTenant();
  const edicaoStatus = await getEdicaoStatus(tenant.id);
  const edicao =
    edicaoStatus.status !== "sem_edicao" ? edicaoStatus.edicao : null;
  const branding = montarBranding(tenant, edicao);

  const supabase = createSupabaseAdminClient();

  // Top1 de cada subcategoria, mesmo dataset que certificados usam.
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
    const cat = Array.isArray(row.categoria)
      ? row.categoria[0]
      : row.categoria;
    if (cat?.nome) catBySubId.set(row.id, cat.nome);
  }

  type PodiumRow = {
    subcategoria_id: string;
    subcategoria_nome: string;
    top1_nome: string;
    top1_votos: number;
  };

  const linhas = (podiums ?? []) as PodiumRow[];
  const vencedores: Vencedor[] = linhas.map((p) => ({
    subcategoria_id: p.subcategoria_id,
    vencedor: p.top1_nome,
    categoria: p.subcategoria_nome,
    grupo: catBySubId.get(p.subcategoria_id) ?? "Outras",
  }));

  return (
    <div className="p-8 space-y-6 print:p-0 print:space-y-0">
      <header className="print:hidden">
        <h1 className="font-display text-3xl font-bold text-cdl-blue flex items-center gap-2">
          <MailOpen className="w-7 h-7 text-cdl-yellow-dark" />
          Convites para a Festa de Premiação
        </h1>
        <p className="text-muted mt-1 max-w-2xl">
          Preencha os dados do evento e o sistema gera 1 convite personalizado
          pra cada vencedor (com nome + categoria). Imprime ou salva em PDF
          pra distribuir.
        </p>
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
        <ConvitesLista vencedores={vencedores} branding={branding} />
      )}
    </div>
  );
}
