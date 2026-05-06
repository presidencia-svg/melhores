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

  // Rate limit: 30 votos por sessão em 1 minuto (proteção contra flood)
  const umMinuto = new Date(Date.now() - 60_000).toISOString();
  const { count: tentativas } = await supabase
    .from("rate_limit_ip")
    .select("*", { head: true, count: "exact" })
    .eq("ip", ip)
    .eq("acao", `voto:${sessao.id}`)
    .gte("criado_em", umMinuto);

  if ((tentativas ?? 0) >= 30) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde 1 minuto." },
      { status: 429 }
    );
  }
  await supabase.from("rate_limit_ip").insert({ ip, acao: `voto:${sessao.id}` });

  // Valida candidato pertence à subcategoria e está aprovado.
  // edicao_id do candidato (denorm — schema 035) e' usado pra scope no voto.
  const { data: cand } = await supabase
    .from("candidatos")
    .select("id, subcategoria_id, status, edicao_id")
    .eq("id", candidatoId)
    .maybeSingle();

  if (!cand || cand.subcategoria_id !== subcategoriaId || cand.status !== "aprovado") {
    return NextResponse.json({ error: "Candidato inválido" }, { status: 400 });
  }

  // INSERT puro, sem upsert — voto é definitivo. Se ja existe linha pra
  // (votante_id, subcategoria_id), o unique constraint do banco impede
  // duplicacao e o erro vira 409. Nao permite trocar voto ja registrado.
  const { error } = await supabase
    .from("votos")
    .insert({
      votante_id: sessao.id,
      subcategoria_id: subcategoriaId,
      candidato_id: candidatoId,
      edicao_id: cand.edicao_id,
      ip,
    });

  if (error) {
    // Postgres '23505' = unique_violation
    const isDuplicate =
      (error as { code?: string }).code === "23505" ||
      /duplicate key|unique constraint/i.test(error.message);
    if (isDuplicate) {
      return NextResponse.json(
        { error: "Você já votou nesta categoria. O voto não pode ser alterado." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Falha ao registrar voto" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
