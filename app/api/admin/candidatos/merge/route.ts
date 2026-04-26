import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({
  origemId: z.string().uuid(),
  destinoId: z.string().uuid(),
});

// Mescla dois candidatos: move votos do origem pro destino e apaga origem.
// Lida com conflito: se um votante já votou nos dois, mantém o voto do destino.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  if (parsed.data.origemId === parsed.data.destinoId) {
    return NextResponse.json({ error: "Origem e destino não podem ser iguais" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Valida que ambos existem e estão na mesma subcategoria
  const { data: cands } = await supabase
    .from("candidatos")
    .select("id, subcategoria_id, sugestoes_count")
    .in("id", [parsed.data.origemId, parsed.data.destinoId]);

  if (!cands || cands.length !== 2) {
    return NextResponse.json({ error: "Candidatos não encontrados" }, { status: 404 });
  }
  const [a, b] = cands;
  if (a!.subcategoria_id !== b!.subcategoria_id) {
    return NextResponse.json({ error: "Candidatos em subcategorias diferentes" }, { status: 400 });
  }

  const origem = parsed.data.origemId;
  const destino = parsed.data.destinoId;

  // 1. Encontra votos do origem cujos votantes JÁ votaram no destino (conflito)
  const { data: votosOrigem } = await supabase
    .from("votos")
    .select("votante_id")
    .eq("candidato_id", origem);

  const votantesOrigem = (votosOrigem ?? []).map((v) => v.votante_id);

  let conflitos: string[] = [];
  if (votantesOrigem.length > 0) {
    const { data: votosDestino } = await supabase
      .from("votos")
      .select("votante_id")
      .eq("candidato_id", destino)
      .in("votante_id", votantesOrigem);
    conflitos = (votosDestino ?? []).map((v) => v.votante_id);
  }

  // 2. Apaga votos conflitantes da origem (votante já tem voto no destino)
  if (conflitos.length > 0) {
    await supabase
      .from("votos")
      .delete()
      .eq("candidato_id", origem)
      .in("votante_id", conflitos);
  }

  // 3. Atualiza votos restantes da origem para o destino
  const { error: updateErr } = await supabase
    .from("votos")
    .update({ candidato_id: destino })
    .eq("candidato_id", origem);

  if (updateErr) {
    return NextResponse.json({ error: `Falha ao mover votos: ${updateErr.message}` }, { status: 500 });
  }

  // 4. Soma sugestoes_count
  const novoCount = (a!.sugestoes_count ?? 0) + (b!.sugestoes_count ?? 0);
  const destinoCount =
    a!.id === destino ? novoCount : novoCount;
  await supabase
    .from("candidatos")
    .update({ sugestoes_count: destinoCount })
    .eq("id", destino);

  // 5. Apaga origem
  const { error: deleteErr } = await supabase.from("candidatos").delete().eq("id", origem);
  if (deleteErr) {
    return NextResponse.json({ error: `Falha ao apagar origem: ${deleteErr.message}` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    votos_movidos: votantesOrigem.length - conflitos.length,
    conflitos_descartados: conflitos.length,
  });
}
