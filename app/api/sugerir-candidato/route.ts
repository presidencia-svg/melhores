import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getVotanteSessao } from "@/lib/sessao";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { normalizarNome } from "@/lib/utils";

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

  const supabase = createSupabaseAdminClient();
  const nomeOriginal = parsed.data.nome.trim();
  const nomeNorm = normalizarNome(nomeOriginal);

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

  // 2) Não tem match — cria novo candidato JÁ APROVADO (atômico, sem update posterior)
  const { data: novo, error } = await supabase
    .from("candidatos")
    .insert({
      subcategoria_id: parsed.data.subcategoriaId,
      nome: nomeOriginal,
      nome_normalizado: nomeNorm,
      origem: "sugerido",
      status: "aprovado",
      sugestoes_count: 1,
    })
    .select("id")
    .single();

  if (error || !novo) {
    console.error("[sugerir-candidato] insert falhou:", error?.message);
    return NextResponse.json({ error: "Falha ao registrar sugestão" }, { status: 500 });
  }

  // Invalida cache da página de votação dessa subcategoria pra próximos votantes verem
  try {
    revalidatePath("/votar/c/[categoria]/[subcategoria]", "page");
    revalidatePath("/votar/categorias", "page");
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true, candidatoId: novo.id, match: false });
}
