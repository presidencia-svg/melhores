import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Lista votantes elegíveis: WhatsApp validado, com pelo menos 1 voto e
// que ainda não receberam a parcial. Resolve via RPC (EXISTS server-side)
// pra evitar o truncamento de 1000 linhas do PostgREST no .in() — mesmo
// padrao do bug do cron de fantasmas.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("elegiveis_parcial");

  if (error) {
    return NextResponse.json(
      { error: `Falha ao listar elegiveis: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, elegiveis: data ?? [] });
}
