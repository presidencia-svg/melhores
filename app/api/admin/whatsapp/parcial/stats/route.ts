import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Stats agregadas da fila de parciais — pra ser exibido antes dos botoes
// no admin/whatsapp. Le da view v_parcial_stats (1 linha) que computa
// tudo no Postgres.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("v_parcial_stats")
    .select("total, ja_receberam, na_fila, enviadas_hoje, ultima_enviada")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: `Falha ao carregar stats: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    total: data?.total ?? 0,
    ja_receberam: data?.ja_receberam ?? 0,
    na_fila: data?.na_fila ?? 0,
    enviadas_hoje: data?.enviadas_hoje ?? 0,
    ultima_enviada: data?.ultima_enviada ?? null,
  });
}
