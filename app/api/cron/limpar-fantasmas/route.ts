import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Janela de tolerância: votante criado há mais que isso sem voto = fantasma.
// 10 min é suficiente pra ler termos + selfie + votar pelo menos 1 subcategoria.
const MIN_MINUTOS_SEM_VOTO = 10;

// Pra Vercel Cron, garante execução até 5 min em plano Pro.
export const maxDuration = 300;

function autorizado(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!autorizado(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const corte = new Date(Date.now() - MIN_MINUTOS_SEM_VOTO * 60_000).toISOString();

  // 1. Identifica fantasmas: votantes sem nenhum voto + criados antes do corte
  const { data: candidatos, error: errSel } = await supabase
    .from("votantes")
    .select("id, selfie_url")
    .lt("criado_em", corte);

  if (errSel) {
    return NextResponse.json(
      { error: `Falha ao listar candidatos: ${errSel.message}` },
      { status: 500 }
    );
  }

  if (!candidatos || candidatos.length === 0) {
    return NextResponse.json({ ok: true, removidos: 0, fotos_removidas: 0 });
  }

  const ids = candidatos.map((v) => v.id);

  // 2. Filtra apenas os que NÃO têm voto
  const { data: comVoto, error: errVotos } = await supabase
    .from("votos")
    .select("votante_id")
    .in("votante_id", ids);

  if (errVotos) {
    return NextResponse.json(
      { error: `Falha ao verificar votos: ${errVotos.message}` },
      { status: 500 }
    );
  }

  const idsComVoto = new Set((comVoto ?? []).map((v) => v.votante_id));
  const fantasmas = candidatos.filter((v) => !idsComVoto.has(v.id));

  if (fantasmas.length === 0) {
    return NextResponse.json({ ok: true, removidos: 0, fotos_removidas: 0 });
  }

  // 3. Apaga fotos do Storage (em lote)
  const fotos = fantasmas
    .map((v) => v.selfie_url)
    .filter((s): s is string => Boolean(s));

  let fotosRemovidas = 0;
  if (fotos.length > 0) {
    // remove() aceita até 1000 paths por chamada
    const lotes: string[][] = [];
    for (let i = 0; i < fotos.length; i += 1000) {
      lotes.push(fotos.slice(i, i + 1000));
    }
    for (const lote of lotes) {
      const { data, error } = await supabase.storage.from("selfies").remove(lote);
      if (!error && data) fotosRemovidas += data.length;
    }
  }

  // 4. Apaga os votantes (cascateia whatsapp_codigos)
  const idsApagar = fantasmas.map((v) => v.id);
  const { error: errDel } = await supabase
    .from("votantes")
    .delete()
    .in("id", idsApagar);

  if (errDel) {
    return NextResponse.json(
      {
        error: `Falha ao apagar votantes: ${errDel.message}`,
        fotos_removidas: fotosRemovidas,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    removidos: fantasmas.length,
    fotos_removidas: fotosRemovidas,
    janela_min: MIN_MINUTOS_SEM_VOTO,
  });
}
