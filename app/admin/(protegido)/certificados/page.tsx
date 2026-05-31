import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Award } from "lucide-react";
import { CertificadosLista, type Vencedor } from "./CertificadosLista";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { montarBranding } from "@/lib/tenant/branding";

// 1h: pos-eleicao a lista de vencedores e' imutavel.
export const revalidate = 3600;

type SearchParams = Promise<{ posicao?: string }>;

export default async function CertificadosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const posicaoNum = sp.posicao === "3" ? 3 : sp.posicao === "2" ? 2 : 1;
  const posicao = posicaoNum as 1 | 2 | 3;

  const tenant = await getCurrentTenant();
  const edicaoStatus = await getEdicaoStatus(tenant.id);
  const edicao =
    edicaoStatus.status !== "sem_edicao" ? edicaoStatus.edicao : null;
  const branding = montarBranding(tenant, edicao);

  const supabase = createSupabaseAdminClient();

  // Pega top1 + top2 + top3 de cada subcategoria (com pelo menos 1 voto).
  // Empate tecnico em 1o lugar gera 1 cert pra cada co-campeao (so na pos=1).
  const [{ data: podiums }, { data: subcatMapping }] = await Promise.all([
    supabase
      .from("v_podium")
      .select(
        "subcategoria_id, subcategoria_nome, top1_id, top1_nome, top1_votos, top2_id, top2_nome, top2_votos, top3_id, top3_nome, top3_votos"
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
    top3_id: string | null;
    top3_nome: string | null;
    top3_votos: number;
  };

  const linhas = (podiums ?? []) as PodiumRow[];

  type PreExpand = {
    subcategoria_id: string;
    vencedor: string;
    categoria: string;
    grupo: string;
  };
  const expandidos: PreExpand[] = [];

  if (posicao === 1) {
    // 1o lugar (+ empatados em 1o)
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
  } else if (posicao === 2) {
    // 2o lugar — so quem nao empatou em 1o e teve voto
    for (const p of linhas) {
      if (!p.top2_id || !p.top2_nome || p.top2_votos <= 0) continue;
      if (p.top2_votos === p.top1_votos) continue; // ja foi co-campeao
      const grupo = catBySubId.get(p.subcategoria_id) ?? "Outras";
      expandidos.push({
        subcategoria_id: p.top2_id,
        vencedor: p.top2_nome,
        categoria: p.subcategoria_nome,
        grupo,
      });
    }
  } else {
    // 3o lugar — quem teve voto
    for (const p of linhas) {
      if (!p.top3_id || !p.top3_nome || p.top3_votos <= 0) continue;
      const grupo = catBySubId.get(p.subcategoria_id) ?? "Outras";
      expandidos.push({
        subcategoria_id: p.top3_id,
        vencedor: p.top3_nome,
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

  const tabs: Array<{ p: 1 | 2 | 3; label: string }> = [
    { p: 1, label: "1º Lugar" },
    { p: 2, label: "2º Lugar" },
    { p: 3, label: "3º Lugar" },
  ];

  return (
    <div className="p-8 space-y-6 print:p-0 print:space-y-0">
      <header className="flex items-start justify-between gap-4 flex-wrap print:hidden">
        <div>
          <h1 className="font-display text-3xl font-bold text-cdl-blue flex items-center gap-2">
            <Award className="w-7 h-7 text-cdl-yellow-dark" />
            Certificados de Premiação · {posicao}º Lugar
          </h1>
          <p className="text-muted mt-1">
            Escolha um modelo, o sistema preenche automaticamente com o{" "}
            {posicao}º colocado de cada subcategoria e gera 1 PDF carta paisagem
            alta qualidade pronto para a gráfica.
          </p>
        </div>
      </header>

      {/* Tabs de navegacao entre as 3 posicoes */}
      <div className="flex gap-2 border-b border-border print:hidden">
        {tabs.map((t) => {
          const ativo = t.p === posicao;
          return (
            <Link
              key={t.p}
              href={t.p === 1 ? "/admin/certificados" : `/admin/certificados?posicao=${t.p}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                ativo
                  ? "border-cdl-blue text-cdl-blue"
                  : "border-transparent text-muted hover:text-cdl-blue"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {vencedores.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted py-12 text-center">
              {posicao === 1
                ? "Sem vencedores ainda — feche a votação primeiro."
                : `Nenhuma subcategoria tem ${posicao}º colocado válido (precisa ter ao menos ${posicao} candidatos votados).`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <CertificadosLista
          vencedores={vencedores}
          branding={branding}
          posicao={posicao}
        />
      )}
    </div>
  );
}
