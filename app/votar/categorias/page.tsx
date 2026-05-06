import { redirect } from "next/navigation";
import Link from "next/link";
import { VotoLayout } from "@/components/voto/VotoLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChevronRight, Lock } from "lucide-react";
import { getVotanteSessao } from "@/lib/sessao";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { SmallCaps, Divider } from "@/components/brand/Marks";
import { seededShuffle } from "@/lib/utils";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";

export default async function CategoriasPage() {
  const sessao = await getVotanteSessao();
  if (!sessao) redirect("/votar");
  if (!sessao.selfie_url) redirect("/votar/selfie");

  const tenant = await getCurrentTenant();
  const edicaoStatus = await getEdicaoStatus(tenant.id);
  if (edicaoStatus.status === "sem_edicao") {
    return (
      <VotoLayout step={3}>
        <p className="text-center text-muted">Edição não encontrada.</p>
      </VotoLayout>
    );
  }
  const edicao = edicaoStatus.edicao;
  const supabase = createSupabaseAdminClient();

  const { data: categoriasRaw } = await supabase
    .from("categorias")
    .select("id, nome, slug, descricao, icone, subcategorias(id, nome, slug, ordem)")
    .eq("edicao_id", edicao.id)
    .eq("ativa", true);

  // Ordem aleatoria estavel por votante: evita favorecer a 1a categoria alfabetica
  // (ex.: Alimentacao). Mesma sessao = mesma ordem; sessoes diferentes = ordens diferentes.
  const categorias = seededShuffle(categoriasRaw ?? [], sessao.id);

  const { data: votos } = await supabase
    .from("votos")
    .select("subcategoria_id")
    .eq("votante_id", sessao.id);

  const votadas = new Set((votos ?? []).map((v) => v.subcategoria_id));
  const totalSub = (categorias ?? []).reduce((acc, c) => acc + (c.subcategorias?.length ?? 0), 0);
  const totalVotadas = votadas.size;

  return (
    <VotoLayout step={3}>
      <div className="mx-auto max-w-3xl w-full pt-4 sm:pt-8 animate-fade-in">
        <div className="text-center mb-8 sm:mb-10">
          <SmallCaps color="var(--gold-700)" size={11}>
            passo 03 · escolha as categorias
          </SmallCaps>
          <h1
            className="font-display text-navy-800 mt-3"
            style={{ fontSize: "clamp(36px, 9vw, 56px)", lineHeight: 1, fontWeight: 300 }}
          >
            Vote nas que <span className="font-display-bold">conhece.</span>
          </h1>
          <p className="text-muted mt-3 text-sm max-w-md mx-auto">
            Não é obrigatório votar em todas. Você pode parar a qualquer momento.
          </p>

          <div className="mt-5 inline-flex items-center gap-3 text-navy-800">
            <Divider width={28} color="var(--gold-500)" />
            <span className="font-display italic" style={{ fontSize: 18, fontWeight: 600 }}>
              {totalVotadas} de {totalSub} votos registrados
            </span>
            <Divider width={28} color="var(--gold-500)" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {categorias.map((cat) => {
            // Subs tambem aleatorias e estaveis por votante+categoria, pelo mesmo motivo
            const subs = seededShuffle(cat.subcategorias ?? [], `${sessao.id}:${cat.id}`);
            return (
              <Card key={cat.id}>
                <CardContent className="!p-0">
                  <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-3">
                    <SmallCaps color="var(--gold-700)" size={10}>
                      {String(subs.length).padStart(2, "0")} subcategorias
                    </SmallCaps>
                    <h2
                      className="font-display-bold text-navy-800 mt-1"
                      style={{ fontSize: "clamp(22px, 5vw, 28px)", lineHeight: 1.05 }}
                    >
                      {cat.nome}
                    </h2>
                  </div>
                  <div className="border-t border-[rgba(10,42,94,0.08)] divide-y divide-[rgba(10,42,94,0.06)]">
                    {subs.map((sub) => {
                      const done = votadas.has(sub.id);
                      if (done) {
                        // Bloqueado — voto definitivo, nao da pra abrir mais
                        return (
                          <div
                            key={sub.id}
                            id={`sub-${sub.id}`}
                            className="flex items-center gap-3 sm:gap-4 px-5 sm:px-7 py-3.5 sm:py-3 bg-navy-800/[0.03] cursor-not-allowed select-none min-h-[52px] scroll-mt-32"
                            title="Voto definitivo. Não é possível alterar."
                          >
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-navy-800/15 text-navy-800/60">
                              <Lock className="w-3 h-3" />
                            </div>
                            <div className="flex-1 font-medium text-navy-800/55 line-through decoration-navy-800/30">
                              {sub.nome}
                            </div>
                            <span
                              className="kicker text-navy-800/40"
                              style={{ fontSize: 9 }}
                            >
                              voto registrado
                            </span>
                          </div>
                        );
                      }
                      return (
                        <Link
                          key={sub.id}
                          id={`sub-${sub.id}`}
                          href={`/votar/c/${cat.slug}/${sub.slug}`}
                          className="flex items-center gap-3 sm:gap-4 px-5 sm:px-7 py-3.5 sm:py-3 hover:bg-cream-200 active:bg-cream-200 transition-colors group min-h-[52px] scroll-mt-32"
                        >
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-[rgba(10,42,94,0.2)] text-navy-800/30">
                            {/* circulo vazio — ainda pode votar */}
                          </div>
                          <div className="flex-1 font-medium text-foreground group-hover:text-navy-800">
                            {sub.nome}
                          </div>
                          <span
                            className="kicker text-navy-800/50"
                            style={{ fontSize: 9 }}
                          >
                            votar
                          </span>
                          <ChevronRight className="w-4 h-4 text-navy-800/40" />
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/votar/finalizar" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full px-12">
              {totalVotadas > 0 ? "Finalizar votação" : "Pular e finalizar"}
            </Button>
          </Link>
        </div>
      </div>
    </VotoLayout>
  );
}
