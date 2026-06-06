import { NextResponse } from "next/server";
import { getAdminTenantOuNull } from "@/lib/admin/auth";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Lista votantes elegíveis: WhatsApp validado, com pelo menos 1 voto e
// que ainda não receberam a parcial. Resolve via RPC (EXISTS server-side)
// pra evitar o truncamento de 1000 linhas do PostgREST no .in() — mesmo
// padrao do bug do cron de fantasmas.
//
// Migration 060: RPC agora exige p_edicao_id pra scopar por tenant — sem
// isso, admin de A via nome+whatsapp+votos de TODOS os tenants (LGPD).
export async function GET() {
  const tenant = await getAdminTenantOuNull();
  if (!tenant) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const edicaoStatus = await getEdicaoStatus(tenant.id);
  if (edicaoStatus.status === "sem_edicao") {
    return NextResponse.json({ ok: true, elegiveis: [] });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("elegiveis_parcial", {
    p_edicao_id: edicaoStatus.edicao.id,
  });

  if (error) {
    return NextResponse.json(
      { error: `Falha ao listar elegiveis: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, elegiveis: data ?? [] });
}
