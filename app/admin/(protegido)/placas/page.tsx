import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Trophy } from "lucide-react";
import { PlacasPrint, type PlacaItem } from "./PlacasPrint";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";

// 1h: pos-eleicao a lista de campeoes e' imutavel.
export const revalidate = 3600;

export default async function PlacasPage() {
  const tenant = await getCurrentTenant();
  const edicaoStatus = await getEdicaoStatus(tenant.id);
  const edicao =
    edicaoStatus.status !== "sem_edicao" ? edicaoStatus.edicao : null;

  const supabase = createSupabaseAdminClient();

  // Top1 (e top2 quando empata em 1o lugar) de cada subcategoria com voto.
  // Mesma logica do /admin/certificados — quem entra no podio entra na placa.
  const { data: podiums } = await supabase
    .from("v_podium")
    .select(
      "subcategoria_id, subcategoria_nome, top1_id, top1_nome, top1_votos, top2_id, top2_nome, top2_votos"
    )
    .eq("edicao_id", edicao?.id ?? "")
    .gt("top1_votos", 0)
    .order("subcategoria_nome", { ascending: true });

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

  const placas: PlacaItem[] = [];
  for (const p of linhas) {
    placas.push({
      id: `${p.subcategoria_id}-1`,
      nome: p.top1_nome,
      subcategoria: p.subcategoria_nome,
    });
    // Empate tecnico no 1o lugar → 2 placas pra mesma subcategoria
    if (p.top2_id && p.top2_nome && p.top2_votos === p.top1_votos) {
      placas.push({
        id: `${p.subcategoria_id}-2`,
        nome: p.top2_nome,
        subcategoria: p.subcategoria_nome,
      });
    }
  }

  const ano = edicao?.ano ?? new Date().getFullYear();

  return (
    <div className="p-8 print:p-0 print:bg-white">
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap print:hidden">
        <div>
          <h1 className="font-display text-3xl font-bold text-cdl-blue flex items-center gap-2">
            <Trophy className="w-7 h-7 text-cdl-yellow-dark" />
            Placas de homenagem
          </h1>
          <p className="text-muted mt-1">
            1º lugar de cada subcategoria + empatados em 1º. Formato 15×10 cm,
            fundo branco, com a logo da instituição. Imprima em PDF (Ctrl/Cmd +
            P) e mande pra fábrica.
          </p>
        </div>
      </header>

      {placas.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted py-12 text-center">
              Sem campeões ainda — feche a votação primeiro.
            </p>
          </CardContent>
        </Card>
      ) : (
        <PlacasPrint
          placas={placas}
          ano={ano}
          tenantNome={tenant.nome}
          cidade={tenant.nome.replace(/^CDL\s+/i, "").trim()}
          logoUrl={tenant.logo_url}
        />
      )}
    </div>
  );
}
