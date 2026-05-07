import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getAdminTenantOuNull } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { criarCheckout, pagseguroConfigurado } from "@/lib/pagseguro/client";

const Body = z.object({
  valor_centavos: z.number().int().min(500).max(100000000), // R$ 5 a R$ 1M
  email: z.string().email(),
});

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const tenant = await getAdminTenantOuNull();
  if (!tenant) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }

  if (!pagseguroConfigurado()) {
    return NextResponse.json(
      { error: "Pagamento não configurado. Avise o suporte." },
      { status: 503 }
    );
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();

  // 1. Cria pagamento `pendente` no banco — id e' usado como reference_id no PS
  const { data: pagamento, error: insertErr } = await supabase
    .from("pagamentos")
    .insert({
      tenant_id: tenant.id,
      valor_centavos: parsed.data.valor_centavos,
      status: "pendente",
      email_comprador: parsed.data.email,
      expira_em: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    })
    .select("id")
    .single();

  if (insertErr || !pagamento) {
    return NextResponse.json(
      { error: `Falha ao registrar: ${insertErr?.message ?? "?"}` },
      { status: 500 }
    );
  }

  // 2. PagSeguro Checkout Pro
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `https://${tenant.dominio ?? "melhoresdoano.app.br"}`;

  const result = await criarCheckout({
    pagamentoId: pagamento.id,
    valorCentavos: parsed.data.valor_centavos,
    comprador: {
      nome: tenant.nome,
      email: parsed.data.email,
      cnpjOuCpf: tenant.cnpj ?? undefined,
    },
    redirectUrl: `${siteUrl}/admin/creditos/sucesso?pagamento=${pagamento.id}`,
    notificationUrl: `${siteUrl}/api/creditos/webhook`,
  });

  if (!result.ok) {
    // Marca pagamento como cancelado pra nao deixar pendente orfao
    await supabase
      .from("pagamentos")
      .update({ status: "cancelado", ps_payload: { erro: result.detalhe } })
      .eq("id", pagamento.id);
    return NextResponse.json(
      { error: `PagSeguro: ${result.detalhe}` },
      { status: 502 }
    );
  }

  // 3. Salva referencias do PS no pagamento
  await supabase
    .from("pagamentos")
    .update({
      ps_charge_id: result.id,
      ps_payment_url: result.payUrl,
      ps_payload: result.payload as Record<string, unknown>,
    })
    .eq("id", pagamento.id);

  return NextResponse.json({
    ok: true,
    pagamento_id: pagamento.id,
    pay_url: result.payUrl,
  });
}
