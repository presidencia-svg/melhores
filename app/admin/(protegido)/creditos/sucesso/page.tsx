import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { formatarReais } from "@/lib/creditos";

export const dynamic = "force-dynamic";

export default async function SucessoPagamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ pagamento?: string }>;
}) {
  const sp = await searchParams;
  const pagamentoId = sp.pagamento;
  const tenant = await getCurrentTenant();

  let pagamento: {
    valor_centavos: number;
    status: string;
  } | null = null;

  if (pagamentoId) {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("pagamentos")
      .select("valor_centavos, status")
      .eq("id", pagamentoId)
      .eq("tenant_id", tenant.id)
      .maybeSingle();
    pagamento = data;
  }

  const pago = pagamento?.status === "pago";

  return (
    <div className="p-8 max-w-xl mx-auto">
      <Card>
        <CardContent>
          <div className="flex flex-col items-center text-center">
            {pago ? (
              <>
                <div className="w-20 h-20 rounded-full bg-cdl-green/15 text-cdl-green-dark flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="font-display text-2xl font-bold text-cdl-blue">
                  Pagamento confirmado
                </h1>
                {pagamento && (
                  <p className="text-sm text-muted mt-2">
                    {formatarReais(pagamento.valor_centavos)} adicionado ao seu saldo.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                  <Clock className="w-10 h-10" />
                </div>
                <h1 className="font-display text-2xl font-bold text-cdl-blue">
                  Pagamento em processamento
                </h1>
                <p className="text-sm text-muted mt-2 max-w-md">
                  O PagSeguro está processando sua transação. Pix geralmente
                  confirma em segundos; cartão pode levar até 30 minutos.
                </p>
                {pagamento && (
                  <p className="text-xs text-muted mt-3">
                    Valor: {formatarReais(pagamento.valor_centavos)} · Status:{" "}
                    <strong>{pagamento.status}</strong>
                  </p>
                )}
                <p className="text-xs text-muted mt-4">
                  Você pode fechar essa página. Quando o pagamento for
                  confirmado, o saldo aparece automaticamente em /admin/creditos.
                </p>
              </>
            )}

            <Link
              href="/admin/creditos"
              className="mt-6 h-11 px-6 inline-flex items-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark"
            >
              Ver meu saldo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
