import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { VotoLayout } from "@/components/voto/VotoLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { getVotanteSessao } from "@/lib/sessao";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { CandidatosLista } from "./CandidatosLista";

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
      <div className="mx-auto max-w-2xl w-full animate-fade-in">
        <Link
          href="/votar/categorias"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-cdl-blue mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar às categorias
        </Link>

        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-cdl-green">
            {categoria.nome}
          </span>
          <h1 className="font-display text-3xl font-bold text-cdl-blue mt-1">
            Melhor {subcategoria.nome.toLowerCase()}
          </h1>
          {subcategoria.descricao && (
            <p className="text-muted mt-2">{subcategoria.descricao}</p>
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
          <Link href="/votar/categorias">
            <Button variant="ghost">Pular esta categoria →</Button>
          </Link>
        </div>
      </div>
    </VotoLayout>
  );
}
