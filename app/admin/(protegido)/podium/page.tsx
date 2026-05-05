import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Medal } from "lucide-react";
import { PodiumLista, type Podium } from "./PodiumLista";
import { AtualizarBtn } from "../AtualizarBtn";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { montarBranding } from "@/lib/tenant/branding";

// 1h: pos-eleicao o podio e' imutavel. Botao "Atualizar" no header invalida
// o cache na hora caso precise (ex: mesclagem de candidatos).
export const revalidate = 3600;

const ORDENS = ["votos", "alfabetica"] as const;

export default async function PodiumPage({
  searchParams,
}: {
  searchParams: Promise<{ ordem?: string }>;
}) {
  const sp = await searchParams;
  const ordem = (ORDENS.includes(sp.ordem as (typeof ORDENS)[number])
    ? sp.ordem
    : "votos") as "votos" | "alfabetica";

  const tenant = await getCurrentTenant();
  const edicaoStatus = await getEdicaoStatus(tenant.id);
  const edicao =
    edicaoStatus.status !== "sem_edicao" ? edicaoStatus.edicao : null;
  const branding = montarBranding(tenant, edicao);

  const supabase = createSupabaseAdminClient();

  let query = supabase.from("v_podium").select("*");
  if (ordem === "votos") {
    query = query.order("total_subcat", { ascending: false });
  } else {
    query = query.order("subcategoria_nome", { ascending: true });
  }
  const [{ data: podiums }, { data: subcatMapping }] = await Promise.all([
    query,
    supabase
      .from("subcategorias")
      .select("id, categoria:categorias(id, nome)"),
  ]);

  // Enriquece cada Podium com categoria_nome via lookup local
  type SubcatRow = {
    id: string;
    categoria: { id: string; nome: string } | { id: string; nome: string }[] | null;
  };
  const catBySubId = new Map<string, string>();
  for (const row of (subcatMapping ?? []) as SubcatRow[]) {
    const cat = Array.isArray(row.categoria) ? row.categoria[0] : row.categoria;
    if (cat?.nome) catBySubId.set(row.id, cat.nome);
  }
  const lista = ((podiums ?? []) as Podium[]).map((p) => ({
    ...p,
    categoria_nome: catBySubId.get(p.subcategoria_id) ?? "Outras",
  }));

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-cdl-blue flex items-center gap-2">
            <Medal className="w-7 h-7 text-cdl-green" />
            Pódio · Resultado final
          </h1>
          <p className="text-muted mt-1">
            1º, 2º e 3º lugares de cada subcategoria com % e votos.
            Baixa em formato Feed (1:1) ou Story (9:16) pra postar.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <nav className="flex gap-1 bg-cream-100 border border-[rgba(10,42,94,0.15)] rounded-lg p-1">
            {ORDENS.map((o) => (
              <Link
                key={o}
                href={`/admin/podium?ordem=${o}`}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  o === ordem ? "bg-cdl-blue text-white" : "text-cdl-blue hover:bg-cdl-blue/10"
                }`}
              >
                {o === "votos" ? "+ votadas" : "A–Z"}
              </Link>
            ))}
          </nav>
          <AtualizarBtn path="/admin/podium" />
        </div>
      </header>

      {lista.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted py-12 text-center">
              Sem dados de votação ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <PodiumLista podiums={lista} branding={branding} />
      )}
    </div>
  );
}
