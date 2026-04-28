import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Reset do "ja recebeu parcial" — todos voltam pra fila e podem receber
// uma nova rodada da parcial. Usado quando todo mundo ja foi atendido
// e quer comecar de novo.
export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { error, count } = await supabase
    .from("votantes")
    .update({ parcial_enviada_em: null }, { count: "exact" })
    .not("parcial_enviada_em", "is", null);

  if (error) {
    return NextResponse.json(
      { error: `Falha ao reiniciar fila: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, resetados: count ?? 0 });
}
