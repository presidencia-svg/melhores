import { NextResponse } from "next/server";
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

  // Fuzzy match com pg_trgm
  const { data: similares } = await supabase.rpc("match_candidato_por_nome", {
    p_subcategoria_id: parsed.data.subcategoriaId,
    p_nome_normalizado: nomeNorm,
    p_threshold: SIMILARIDADE_MIN,
  });

  if (Array.isArray(similares) && similares.length > 0) {
    const top = similares[0] as { id: string };
    await supabase
      .from("candidatos")
      .update({ sugestoes_count: (similares[0] as { sugestoes_count?: number }).sugestoes_count ? undefined : 1 })
      .eq("id", top.id);
    await supabase.rpc("inc_sugestoes_count", { p_id: top.id });
    return NextResponse.json({ ok: true, candidatoId: top.id, match: true });
  }

  // Cria candidato sugerido (pendente)
  const { data: novo, error } = await supabase
    .from("candidatos")
    .insert({
      subcategoria_id: parsed.data.subcategoriaId,
      nome: nomeOriginal,
      nome_normalizado: nomeNorm,
      origem: "sugerido",
      status: "pendente",
      sugestoes_count: 1,
    })
    .select("id")
    .single();

  if (error || !novo) {
    return NextResponse.json({ error: "Falha ao registrar sugestão" }, { status: 500 });
  }

  // Sugeridos pendentes não recebem voto até serem aprovados — então aprova auto
  // (decisão fuzzy+auto aprovar primeiro voto: muda quando admin moderar duplicatas)
  await supabase.from("candidatos").update({ status: "aprovado" }).eq("id", novo.id);

  return NextResponse.json({ ok: true, candidatoId: novo.id, match: false });
}
