import { NextResponse } from "next/server";
import { isAdmin, getAdminTenantOuNull } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { consultarPagamento } from "@/lib/mercadopago/client";
import { creditarCredito } from "@/lib/creditos";

// Forca uma consulta ao Mercado Pago pra um pagamento pendente. Util
// quando o webhook nao chegou (atraso ou config) — o admin clica e a
// gente faz a mesma logica do /api/creditos/webhook sob demanda.

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const tenant = await getAdminTenantOuNull();
  if (!tenant) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { data: pagamento } = await supabase
    .from("pagamentos")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (!pagamento) {
    return NextResponse.json(
      { error: "Pagamento não encontrado" },
      { status: 404 }
    );
  }

  if (pagamento.status === "pago") {
    return NextResponse.json({
      ok: true,
      status: "pago",
      ja_processado: true,
    });
  }

  if (!pagamento.mp_payment_id) {
    return NextResponse.json(
      { error: "Pagamento sem mp_payment_id — MP nunca retornou um ID" },
      { status: 400 }
    );
  }

  const { status: mpStatus, payload } = await consultarPagamento(
    pagamento.mp_payment_id
  );

  if (!mpStatus) {
    return NextResponse.json(
      { error: "MP não retornou status pra esse pagamento" },
      { status: 502 }
    );
  }

  if (mpStatus === "approved") {
    await supabase
      .from("pagamentos")
      .update({
        status: "pago",
        pago_em: new Date().toISOString(),
        mp_payload: payload as Record<string, unknown>,
      })
      .eq("id", pagamento.id);

    try {
      await creditarCredito({
        tenantId: pagamento.tenant_id,
        valorCentavos: pagamento.valor_centavos,
        motivo: "recarga",
        descricao: `Recarga via Mercado Pago — reconciliacao manual (${pagamento.valor_centavos / 100} BRL)`,
        pagamentoId: pagamento.id,
      });
    } catch (e) {
      console.error("[creditos/reconsultar] creditarCredito falhou:", e);
      return NextResponse.json(
        {
          error: "Pagamento aprovado mas falhou ao creditar — contate suporte",
          detalhe: e instanceof Error ? e.message : "?",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, status: "pago", creditado: true });
  }

  if (mpStatus === "rejected" || mpStatus === "cancelled") {
    await supabase
      .from("pagamentos")
      .update({
        status: "cancelado",
        mp_payload: payload as Record<string, unknown>,
      })
      .eq("id", pagamento.id);
    return NextResponse.json({ ok: true, status: "cancelado" });
  }

  // pending, in_process, authorized — atualiza payload mas mantem pendente
  await supabase
    .from("pagamentos")
    .update({ mp_payload: payload as Record<string, unknown> })
    .eq("id", pagamento.id);

  return NextResponse.json({
    ok: true,
    status: mpStatus,
    ainda_pendente: true,
  });
}
