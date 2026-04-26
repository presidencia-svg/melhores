import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Lista votantes elegíveis: WhatsApp validado, com pelo menos 1 voto e
// que ainda não receberam a parcial.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  // votantes com whatsapp validado e sem parcial enviada
  const { data: votantes, error } = await supabase
    .from("votantes")
    .select("id, nome, whatsapp")
    .eq("whatsapp_validado", true)
    .is("parcial_enviada_em", null)
    .not("whatsapp", "is", null);

  if (error) {
    return NextResponse.json(
      { error: `Falha ao buscar votantes: ${error.message}` },
      { status: 500 }
    );
  }

  // filtra apenas os que têm voto
  const ids = (votantes ?? []).map((v) => v.id);
  if (ids.length === 0) {
    return NextResponse.json({ ok: true, elegiveis: [] });
  }

  const { data: votosCount, error: votosErr } = await supabase
    .from("votos")
    .select("votante_id")
    .in("votante_id", ids);

  if (votosErr) {
    return NextResponse.json(
      { error: `Falha ao contar votos: ${votosErr.message}` },
      { status: 500 }
    );
  }

  const tem = new Set((votosCount ?? []).map((v) => v.votante_id));
  const elegiveis = (votantes ?? [])
    .filter((v) => tem.has(v.id))
    .map((v) => ({ votante_id: v.id, votante_nome: v.nome, whatsapp: v.whatsapp }));

  return NextResponse.json({ ok: true, elegiveis });
}
