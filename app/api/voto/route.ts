import { NextResponse } from "next/server";
import { z } from "zod";
import { getVotanteSessao } from "@/lib/sessao";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/utils";

const Body = z.object({
  subcategoriaId: z.string().uuid(),
  candidatoId: z.string().uuid(),
});

export async function POST(req: Request) {
  const sessao = await getVotanteSessao();
  if (!sessao) {
    return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
  }
  if (!sessao.selfie_url) {
    return NextResponse.json({ error: "Selfie obrigatória antes de votar" }, { status: 403 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const { subcategoriaId, candidatoId } = parsed.data;
  const supabase = createSupabaseAdminClient();
  const ip = getClientIp(req.headers);

  // Valida candidato pertence à subcategoria e está aprovado
  const { data: cand } = await supabase
    .from("candidatos")
    .select("id, subcategoria_id, status")
    .eq("id", candidatoId)
    .maybeSingle();

  if (!cand || cand.subcategoria_id !== subcategoriaId || cand.status !== "aprovado") {
    return NextResponse.json({ error: "Candidato inválido" }, { status: 400 });
  }

  // Upsert voto (1 por votante/subcategoria)
  const { error } = await supabase
    .from("votos")
    .upsert(
      { votante_id: sessao.id, subcategoria_id: subcategoriaId, candidato_id: candidatoId, ip },
      { onConflict: "votante_id,subcategoria_id" }
    );

  if (error) {
    return NextResponse.json({ error: "Falha ao registrar voto" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
