import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { listarEdicoesComResultado } from "@/lib/resultados-publicos";
import { ResultadosLista, type CategoriaResultado } from "./ResultadosLista";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Resultados — Melhores do Ano",
  description: "Veja os vencedores das edições anteriores do Melhores do Ano.",
};

type PodiumRow = {
  subcategoria_id: string;
  subcategoria_nome: string;
  total_subcat: number;
  top1_nome: string | null;
  top1_votos: number | null;
  top2_nome: string | null;
  top2_votos: number | null;
  top3_nome: string | null;
  top3_votos: number | null;
};

type SubcatRow = {
  id: string;
  ordem: number | null;
  categoria: { id: string; nome: string; ordem: number | null } | { id: string; nome: string; ordem: number | null }[] | null;
};

export default async function ResultadosPage({
  searchParams,
}: {
  searchParams: Promise<{ edicao?: string }>;
}) {
  const sp = await searchParams;
  const tenant = await getCurrentTenant();
  const edicoes = await listarEdicoesComResultado(tenant.id);
  const edicao = edicoes.find((e) => e.id === sp.edicao) ?? edicoes[0] ?? null;

  let categorias: CategoriaResultado[] = [];
  let totalVotos = 0;

  if (edicao) {
    const supabase = createSupabaseAdminClient();
    const [{ data: podiums }, { data: subcats }] = await Promise.all([
      supabase.from("v_podium").select("*").eq("edicao_id", edicao.id),
      supabase
        .from("subcategorias")
        .select("id, ordem, categoria:categorias(id, nome, ordem)")
        .eq("edicao_id", edicao.id),
    ]);

    const subInfo = new Map<string, { ordem: number; catId: string; catNome: string; catOrdem: number }>();
    for (const s of (subcats ?? []) as SubcatRow[]) {
      const cat = Array.isArray(s.categoria) ? s.categoria[0] : s.categoria;
      subInfo.set(s.id, {
        ordem: s.ordem ?? 0,
        catId: cat?.id ?? "outras",
        catNome: cat?.nome ?? "Outras",
        catOrdem: cat?.ordem ?? 999,
      });
    }

    const porCat = new Map<string, CategoriaResultado & { ordem: number }>();
    for (const p of (podiums ?? []) as PodiumRow[]) {
      const info = subInfo.get(p.subcategoria_id) ?? { ordem: 0, catId: "outras", catNome: "Outras", catOrdem: 999 };
      totalVotos += Number(p.total_subcat ?? 0);
      let cat = porCat.get(info.catId);
      if (!cat) {
        cat = { id: info.catId, nome: info.catNome, ordem: info.catOrdem, subcategorias: [] };
        porCat.set(info.catId, cat);
      }
      const colocados = [
        { nome: p.top1_nome, votos: p.top1_votos },
        { nome: p.top2_nome, votos: p.top2_votos },
        { nome: p.top3_nome, votos: p.top3_votos },
      ]
        .filter((c): c is { nome: string; votos: number } => !!c.nome && (c.votos ?? 0) > 0)
        .map((c) => ({ nome: c.nome, votos: Number(c.votos) }));
      cat.subcategorias.push({
        id: p.subcategoria_id,
        nome: p.subcategoria_nome,
        ordem: info.ordem,
        total: Number(p.total_subcat ?? 0),
        colocados,
      });
    }
    categorias = [...porCat.values()]
      .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"))
      .map((c) => ({
        ...c,
        subcategorias: c.subcategorias.sort(
          (a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR")
        ),
      }));
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <header className="border-b border-[rgba(10,42,94,0.12)] bg-cream-100/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">
          <Link href="/">
            <Logo />
          </Link>
          <Link href="/" className="text-sm text-navy-800/60 hover:text-navy-800 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Início
          </Link>
        </div>
      </header>

      <section className="gradient-cdl-hero text-cream-100 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Trophy className="w-10 h-10 mx-auto text-gold-400 mb-4" />
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
            Resultados
          </h1>
          {edicao ? (
            <p className="text-cream-100/80 mt-3">
              {edicao.nome} · {totalVotos.toLocaleString("pt-BR")} votos válidos
            </p>
          ) : (
            <p className="text-cream-100/80 mt-3">Nenhum resultado publicado ainda.</p>
          )}
          {edicoes.length > 1 && (
            <nav className="flex flex-wrap justify-center gap-2 mt-6">
              {edicoes.map((e) => (
                <Link
                  key={e.id}
                  href={`/resultados?edicao=${e.id}`}
                  className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                    e.id === edicao?.id
                      ? "bg-gold-400 text-navy-900 border-gold-400"
                      : "border-cream-100/40 text-cream-100 hover:bg-cream-100/10"
                  }`}
                >
                  {e.ano}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 flex-1">
        {edicao ? (
          <ResultadosLista categorias={categorias} />
        ) : (
          <p className="text-center text-muted py-16">
            Os resultados aparecem aqui assim que forem divulgados.
          </p>
        )}
      </main>
    </div>
  );
}
