import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowLeft, Wallet, ShieldOff, ShieldCheck } from "lucide-react";
import { isSuperAdmin } from "@/lib/super-admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatarReais } from "@/lib/creditos";
import { CortesiaForm, BloquearButton } from "./TenantActions";

export const dynamic = "force-dynamic";

export default async function SuperTenantDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isSuperAdmin())) redirect("/super/login");
  const { id } = await params;

  const supabase = createSupabaseAdminClient();

  const [{ data: tenant }, { data: saldoRow }, { data: transacoes }, { data: pagamentos }] =
    await Promise.all([
      supabase.from("tenants").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("creditos_tenant")
        .select("saldo_centavos")
        .eq("tenant_id", id)
        .maybeSingle(),
      supabase
        .from("transacoes_credito")
        .select("*")
        .eq("tenant_id", id)
        .order("criado_em", { ascending: false })
        .limit(50),
      supabase
        .from("pagamentos")
        .select("*")
        .eq("tenant_id", id)
        .order("criado_em", { ascending: false })
        .limit(20),
    ]);

  if (!tenant) notFound();
  const saldo = saldoRow?.saldo_centavos ?? 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link
        href="/super"
        className="text-sm text-cdl-blue hover:underline inline-flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <header className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cdl-blue">
            {tenant.nome}
          </h1>
          <p className="text-sm text-muted mt-1">
            <code className="bg-zinc-100 px-1 rounded">{tenant.slug}</code>
            {tenant.dominio ? ` · ${tenant.dominio}` : ""}
            {tenant.cnpj ? ` · CNPJ ${tenant.cnpj}` : ""}
          </p>
        </div>
        <BloquearButton tenantId={tenant.id} ativo={tenant.ativo} />
      </header>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 text-cdl-blue/60 text-xs uppercase tracking-widest mb-1">
              <Wallet className="w-3 h-3" />
              Saldo atual
            </div>
            <p
              className={`font-display text-3xl font-bold ${
                saldo <= 0
                  ? "text-red-600"
                  : saldo < 10000
                  ? "text-orange-600"
                  : "text-cdl-blue"
              }`}
            >
              {formatarReais(saldo)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 text-cdl-blue/60 text-xs uppercase tracking-widest mb-1">
              {tenant.ativo ? (
                <>
                  <ShieldCheck className="w-3 h-3" />
                  Status
                </>
              ) : (
                <>
                  <ShieldOff className="w-3 h-3" />
                  Status
                </>
              )}
            </div>
            <p
              className={`font-display text-2xl font-bold ${
                tenant.ativo ? "text-cdl-green-dark" : "text-red-600"
              }`}
            >
              {tenant.ativo ? "Ativo" : "Bloqueado"}
            </p>
            <p className="text-xs text-muted mt-1">
              Criado em{" "}
              {new Date(tenant.criado_em).toLocaleDateString("pt-BR")} via{" "}
              {tenant.criada_via ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent>
          <h2 className="font-display text-lg font-bold text-cdl-blue mb-3">
            Adicionar crédito (cortesia / ajuste)
          </h2>
          <CortesiaForm tenantId={tenant.id} />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent>
          <h2 className="font-display text-lg font-bold text-cdl-blue mb-3">
            Pagamentos
          </h2>
          {!pagamentos || pagamentos.length === 0 ? (
            <p className="text-sm text-muted">Nenhum pagamento ainda.</p>
          ) : (
            <div className="divide-y divide-border/50 text-sm">
              {pagamentos.map((p) => (
                <div key={p.id} className="flex justify-between py-2">
                  <div>
                    <span className="font-mono font-bold">
                      {formatarReais(p.valor_centavos)}
                    </span>
                    <span className="text-muted ml-2 text-xs">
                      {new Date(p.criado_em).toLocaleString("pt-BR")}
                    </span>
                    {p.email_comprador ? (
                      <div className="text-xs text-muted">
                        {p.email_comprador}
                      </div>
                    ) : null}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded h-fit ${
                      p.status === "pago"
                        ? "bg-cdl-green/15 text-cdl-green-dark"
                        : p.status === "pendente"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="font-display text-lg font-bold text-cdl-blue mb-3">
            Movimentações ({transacoes?.length ?? 0})
          </h2>
          {!transacoes || transacoes.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma movimentação.</p>
          ) : (
            <div className="divide-y divide-border/50 text-sm font-mono">
              {transacoes.map((t) => (
                <div key={t.id} className="flex justify-between py-1.5 text-xs">
                  <div>
                    <span
                      className={
                        t.valor_centavos > 0
                          ? "text-cdl-green-dark"
                          : "text-zinc-700"
                      }
                    >
                      {t.valor_centavos > 0 ? "+" : ""}
                      {formatarReais(t.valor_centavos)}
                    </span>
                    <span className="text-muted ml-2">{t.motivo}</span>
                    {t.descricao ? (
                      <span className="text-muted ml-1">— {t.descricao}</span>
                    ) : null}
                  </div>
                  <div className="text-muted">
                    {new Date(t.criado_em).toLocaleString("pt-BR")} · saldo:{" "}
                    {formatarReais(t.saldo_apos_centavos)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
