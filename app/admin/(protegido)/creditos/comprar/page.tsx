import { Card, CardContent } from "@/components/ui/Card";
import { ArrowLeft, CreditCard, QrCode, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { ComprarForm } from "./ComprarForm";

export const dynamic = "force-dynamic";

export default async function ComprarCreditoPage() {
  const tenant = await getCurrentTenant();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/admin/creditos"
        className="text-sm text-cdl-blue hover:underline inline-flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <Card>
        <CardContent>
          <h1 className="font-display text-2xl font-bold text-cdl-blue mb-1">
            Comprar créditos
          </h1>
          <p className="text-sm text-muted mb-6">
            Pagamento via Mercado Pago. Cartão de crédito (até 12x) ou Pix.
          </p>

          <div className="grid sm:grid-cols-3 gap-2 mb-6 text-xs text-cdl-blue">
            <div className="flex items-center gap-2 p-2 bg-cdl-blue/5 rounded">
              <CreditCard className="w-4 h-4" />
              Cartão crédito
            </div>
            <div className="flex items-center gap-2 p-2 bg-cdl-blue/5 rounded">
              <QrCode className="w-4 h-4" />
              Pix instantâneo
            </div>
            <div className="flex items-center gap-2 p-2 bg-cdl-blue/5 rounded">
              <ShieldCheck className="w-4 h-4" />
              Saldo creditado em segundos
            </div>
          </div>

          <ComprarForm
            tenantNome={tenant.nome}
            emailDefault={tenant.admin_email ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
