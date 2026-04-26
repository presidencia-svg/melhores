import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { VotoLayout } from "@/components/voto/VotoLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { getVotanteSessao } from "@/lib/sessao";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { CandidatosLista } from "./CandidatosLista";
import { SmallCaps } from "@/components/brand/Marks";

type Params = { params: Promise<{ categoria: string; subcategoria: string }> };

export default async function VotarSubcategoriaPage({ params }: Params) {
  const sessao = await getVotanteSessao();
  if (!sessao) redirect("/votar");
  if (!sessao.selfie_url) redirect("/votar/selfie");

  const { categoria: catSlug, subcategoria: subSlug } = await params;

  const supabase = createSupabaseAdminClient();

  const { data: edicao } = await supabase
    .from("edicao")
    .select("id")
    .eq("ativa", true)
    .order("ano", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!edicao) notFound();

  const { data: categoria } = await supabase
    .from("categorias")
    .select("id, nome, slug")
    .eq("edicao_id", edicao.id)
    .eq("slug", catSlug)
    .maybeSingle();
  if (!categoria) notFound();

  const { data: subcategoria } = await supabase
    .from("subcategorias")
    .select("id, nome, slug, descricao")
    .eq("categoria_id", categoria.id)
    .eq("slug", subSlug)
    .maybeSingle();
  if (!subcategoria) notFound();

  const { data: candidatos } = await supabase
    .from("candidatos")
    .select("id, nome, descricao, foto_url")
    .eq("subcategoria_id", subcategoria.id)
    .eq("status", "aprovado")
    .order("nome");

  const { data: votoExistente } = await supabase
    .from("votos")
    .select("candidato_id")
    .eq("votante_id", sessao.id)
    .eq("subcategoria_id", subcategoria.id)
    .maybeSingle();

  return (
    <VotoLayout step={3}>
      <div className="mx-auto max-w-2xl w-full pt-4 sm:pt-8 animate-fade-in">
        <Link
          href={`/votar/categorias#sub-${subcategoria.id}`}
          className="inline-flex items-center gap-2 text-xs text-muted hover:text-navy-800 mb-4 sm:mb-6 transition-colors kicker"
          style={{ fontSize: 10 }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          voltar às categorias
        </Link>

        <div className="mb-6 sm:mb-8">
          <SmallCaps color="var(--gold-700)" size={11}>
            {categoria.nome}
          </SmallCaps>
          <h1
            className="font-display text-navy-800 mt-2"
            style={{ fontSize: "clamp(34px, 9vw, 56px)", lineHeight: 1, fontWeight: 300 }}
          >
            Melhor <span className="font-display-bold">{subcategoria.nome.toLowerCase()}</span>
          </h1>
          {subcategoria.descricao && (
            <p className="text-muted mt-3 text-sm">{subcategoria.descricao}</p>
          )}
        </div>

        <Card>
          <CardContent>
            <CandidatosLista
              subcategoriaId={subcategoria.id}
              candidatos={candidatos ?? []}
              votoAtual={votoExistente?.candidato_id ?? null}
            />
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href={`/votar/categorias#sub-${subcategoria.id}`}>
            <Button variant="ghost">Pular esta categoria →</Button>
          </Link>
        </div>
      </div>
    </VotoLayout>
  );
}
