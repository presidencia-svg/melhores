import { NextResponse } from "next/server";
import { getAdminTenantOuNull } from "@/lib/admin/auth";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Reset do "ja recebeu parcial" — todos voltam pra fila e podem receber
// uma nova rodada da parcial. Usado quando todo mundo ja foi atendido
// e quer comecar de novo.
//
// Cross-tenant guard: scoped por edicao_id do tenant logado, senao admin
// de A resetava parcial de TODOS os tenants — admin de B teria sua fila
// resetada sem consentimento e provavel duplicate-send do proximo
// disparador automatico.
export async function POST() {
  const tenant = await getAdminTenantOuNull();
  if (!tenant) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const edicaoStatus = await getEdicaoStatus(tenant.id);
  if (edicaoStatus.status === "sem_edicao") {
    return NextResponse.json({ ok: true, resetados: 0 });
  }

  const supabase = createSupabaseAdminClient();
  const { error, count } = await supabase
    .from("votantes")
    .update({ parcial_enviada_em: null }, { count: "exact" })
    .eq("edicao_id", edicaoStatus.edicao.id)
    .not("parcial_enviada_em", "is", null);

  if (error) {
    return NextResponse.json(
      { error: `Falha ao reiniciar fila: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, resetados: count ?? 0 });
}
