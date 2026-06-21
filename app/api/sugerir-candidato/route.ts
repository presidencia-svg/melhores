import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getVotanteSessao } from "@/lib/sessao";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { normalizarNome, nomeCandidatoValido, tituloPT } from "@/lib/utils";
import { getModoSugestoes } from "@/lib/sugestoes/mode";

const Body = z.object({
  subcategoriaId: z.string().uuid(),
  nome: z.string().min(3).max(120),
});

const SIMILARIDADE_MIN = 0.55;

export async function POST(req: Request) {
  const sessao = await getVotanteSessao();
  if (!sessao) {
    return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const modoSugestoes = await getModoSugestoes();
  if (modoSugestoes === "desligadas") {
    return NextResponse.json(
      { error: "Sugestão pública de candidato está desligada pelo admin" },
      { status: 403 }
    );
  }
  // "livre" → entra aprovado direto
  // "aprovacao" → entra pendente, admin libera depois em /admin/sugestoes
  const statusInicial = modoSugestoes === "aprovacao" ? "pendente" : "aprovado";

  const supabase = createSupabaseAdminClient();
  const nomeOriginal = parsed.data.nome.trim();

  const validacao = nomeCandidatoValido(nomeOriginal);
  if (!validacao.ok) {
    return NextResponse.json({ error: validacao.motivo }, { status: 400 });
  }

  // Padroniza pra Title Case ("Karina Moraes"), preservando preposicoes minusculas.
  const nomeFormatado = tituloPT(nomeOriginal);
  const nomeNorm = normalizarNome(nomeFormatado);

  // Cross-tenant guard: subcategoria precisa ser da MESMA edicao que o
  // votante (sessao.edicao_id). Sem isso, votante do tenant A poderia
  // sugerir candidatos pra subcategorias de outros tenants e poluir
  // catalogos alheios. Lookup antecipado da subcategoria pra cobrir
  // ambos os caminhos (match + insert).
  const { data: subcat } = await supabase
    .from("subcategorias")
    .select("edicao_id")
    .eq("id", parsed.data.subcategoriaId)
    .maybeSingle();
  if (!subcat) {
    return NextResponse.json({ error: "Subcategoria não encontrada" }, { status: 404 });
  }
  if (subcat.edicao_id !== sessao.edicao_id) {
    return NextResponse.json({ error: "Subcategoria inválida" }, { status: 400 });
  }

  // 1) Fuzzy match — se já existe candidato parecido na mesma subcategoria, reutiliza
  const { data: similares } = await supabase.rpc("match_candidato_por_nome", {
    p_subcategoria_id: parsed.data.subcategoriaId,
    p_nome_normalizado: nomeNorm,
    p_threshold: SIMILARIDADE_MIN,
  });

  if (Array.isArray(similares) && similares.length > 0) {
    const top = similares[0] as { id: string };
    // Incrementa contador de sugestões via RPC (atômico)
    await supabase.rpc("inc_sugestoes_count", { p_id: top.id });
    return NextResponse.json({ ok: true, candidatoId: top.id, match: true });
  }

  // 2) Não tem match — cria novo candidato com status conforme modo:
  //    livre → "aprovado" (aparece na votacao imediatamente)
  //    aprovacao → "pendente" (so' aparece depois que admin liberar)
  // edicao_id herda da subcategoria pai (denorm — schema 035; ja' validado acima).
  const { data: novo, error } = await supabase
    .from("candidatos")
    .insert({
      subcategoria_id: parsed.data.subcategoriaId,
      edicao_id: subcat.edicao_id,
      nome: nomeFormatado,
      nome_normalizado: nomeNorm,
      origem: "sugerido",
      status: statusInicial,
      sugestoes_count: 1,
    })
    .select("id")
    .single();

  if (error || !novo) {
    console.error("[sugerir-candidato] insert falhou:", error?.message);
    return NextResponse.json({ error: "Falha ao registrar sugestão" }, { status: 500 });
  }

  // Invalida cache da página de votação dessa subcategoria pra próximos
  // votantes verem (so' faz sentido pra modo livre — em "aprovacao" o
  // candidato vai aparecer so' apos a aprovacao do admin, que ja revalida).
  if (statusInicial === "aprovado") {
    try {
      revalidatePath("/votar/c/[categoria]/[subcategoria]", "page");
      revalidatePath("/votar/categorias", "page");
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    ok: true,
    candidatoId: novo.id,
    match: false,
    pendente: statusInicial === "pendente",
  });
}
