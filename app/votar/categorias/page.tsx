import { redirect } from "next/navigation";
import Link from "next/link";
import { VotoLayout } from "@/components/voto/VotoLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { getVotanteSessao } from "@/lib/sessao";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export default async function CategoriasPage() {
  const sessao = await getVotanteSessao();
  if (!sessao) redirect("/votar");
  if (!sessao.selfie_url) redirect("/votar/selfie");

  const supabase = createSupabaseAdminClient();

  const { data: edicao } = await supabase
    .from("edicao")
    .select("id")
    .eq("ativa", true)
    .order("ano", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!edicao) {
    return (
      <VotoLayout step={3}>
        <p className="text-center text-muted">Edição não encontrada.</p>
      </VotoLayout>
    );
  }

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nome, slug, descricao, icone, subcategorias(id, nome, slug, ordem)")
    .eq("edicao_id", edicao.id)
    .eq("ativa", true)
    .order("ordem");

  const { data: votos } = await supabase
    .from("votos")
    .select("subcategoria_id")
    .eq("votante_id", sessao.id);

  const votadas = new Set((votos ?? []).map((v) => v.subcategoria_id));
  const totalSub = (categorias ?? []).reduce((acc, c) => acc + (c.subcategorias?.length ?? 0), 0);
  const totalVotadas = votadas.size;

  return (
    <VotoLayout step={3}>
      <div className="mx-auto max-w-3xl w-full animate-fade-in">
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl font-bold text-cdl-blue mb-2">
            Escolha as categorias
          </h1>
          <p className="text-muted">
            Vote nas que você conhece. Você pode parar a qualquer momento.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-cdl-blue/10 px-4 py-2">
            <Sparkles className="w-4 h-4 text-cdl-blue" />
            <span className="text-sm font-semibold text-cdl-blue">
              {totalVotadas} de {totalSub} votos registrados
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {(categorias ?? []).map((cat) => {
            const subs = (cat.subcategorias ?? []).slice().sort((a, b) => a.ordem - b.ordem);
            return (
              <Card key={cat.id}>
                <CardContent className="!p-0">
                  <div className="px-6 pt-6 pb-3">
                    <h2 className="font-display text-xl font-bold text-cdl-blue">{cat.nome}</h2>
                    {cat.descricao && (
                      <p className="text-sm text-muted mt-1">{cat.descricao}</p>
                    )}
                  </div>
                  <div className="border-t border-border divide-y divide-border">
                    {subs.map((sub) => {
                      const done = votadas.has(sub.id);
                      return (
                        <Link
                          key={sub.id}
                          href={`/votar/c/${cat.slug}/${sub.slug}`}
                          className="flex items-center gap-3 px-6 py-4 hover:bg-cdl-blue/5 transition-colors group"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              done ? "bg-cdl-green text-white" : "bg-border text-muted"
                            }`}
                          >
                            {done ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">·</span>}
                          </div>
                          <div className="flex-1 font-medium text-foreground group-hover:text-cdl-blue">
                            {sub.nome}
                          </div>
                          <span className="text-xs text-muted">
                            {done ? "Votado" : "Votar"}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted" />
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/votar/finalizar" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full font-bold">
              {totalVotadas > 0 ? "Finalizar votação" : "Pular e finalizar"}
            </Button>
          </Link>
        </div>
      </div>
    </VotoLayout>
  );
}
