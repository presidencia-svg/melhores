import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Users, Wallet, CheckCircle2, XCircle, Clock } from "lucide-react";
import { isSuperAdmin } from "@/lib/super-admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatarReais } from "@/lib/creditos";

export const dynamic = "force-dynamic";

type TenantRow = {
  id: string;
  slug: string;
  nome: string;
  cnpj: string | null;
  dominio: string | null;
  ativo: boolean;
  admin_email: string | null;
  criada_via: string | null;
  trial_ate: string | null;
  criado_em: string;
};

export default async function SuperDashboard() {
  if (!(await isSuperAdmin())) redirect("/super/login");

  const supabase = createSupabaseAdminClient();

  const [
    { data: tenants },
    { data: saldos },
    { count: pendentesTotal },
    { count: pagosTotal },
  ] = await Promise.all([
    supabase
      .from("tenants")
      .select(
        "id, slug, nome, cnpj, dominio, ativo, admin_email, criada_via, trial_ate, criado_em"
      )
      .order("criado_em", { ascending: false }),
    supabase.from("creditos_tenant").select("tenant_id, saldo_centavos"),
    supabase
      .from("pagamentos")
      .select("*", { head: true, count: "exact" })
      .eq("status", "pendente"),
    supabase
      .from("pagamentos")
      .select("*", { head: true, count: "exact" })
      .eq("status", "pago"),
  ]);

  const saldoMap = new Map(
    (saldos ?? []).map((s) => [s.tenant_id, s.saldo_centavos])
  );
  const tenantsList = (tenants ?? []) as TenantRow[];

  // Agregados
  const totalTenants = tenantsList.length;
  const ativosCount = tenantsList.filter((t) => t.ativo).length;
  const saldoTotal = Array.from(saldoMap.values()).reduce(
    (a, b) => a + (b ?? 0),
    0
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cdl-blue">
            Super-Admin
          </h1>
          <p className="text-muted mt-1">
            Plataforma Melhores do Ano · gestão de clientes
          </p>
        </div>
        <form action="/api/super/logout" method="post">
          <button
            type="submit"
            className="text-sm text-muted hover:text-red-600"
          >
            Sair
          </button>
        </form>
      </header>

      <div className="grid sm:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 text-cdl-blue/60 text-xs uppercase tracking-widest mb-1">
              <Users className="w-3 h-3" />
              Tenants
            </div>
            <p className="font-display text-2xl font-bold text-cdl-blue">
              {totalTenants}
            </p>
            <p className="text-xs text-muted">{ativosCount} ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 text-cdl-blue/60 text-xs uppercase tracking-widest mb-1">
              <Wallet className="w-3 h-3" />
              Saldo total na rede
            </div>
            <p className="font-display text-2xl font-bold text-cdl-blue">
              {formatarReais(saldoTotal)}
            </p>
            <p className="text-xs text-muted">somado de todos tenants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 text-orange-600/80 text-xs uppercase tracking-widest mb-1">
              <Clock className="w-3 h-3" />
              Pagamentos pendentes
            </div>
            <p className="font-display text-2xl font-bold text-orange-600">
              {pendentesTotal ?? 0}
            </p>
            <p className="text-xs text-muted">aguardando confirmação</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 text-cdl-green-dark/80 text-xs uppercase tracking-widest mb-1">
              <CheckCircle2 className="w-3 h-3" />
              Pagamentos confirmados
            </div>
            <p className="font-display text-2xl font-bold text-cdl-green-dark">
              {pagosTotal ?? 0}
            </p>
            <p className="text-xs text-muted">lifetime</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <h2 className="font-display text-lg font-bold text-cdl-blue mb-3">
            Tenants
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 px-2 text-xs uppercase tracking-wider text-muted">
                    Tenant
                  </th>
                  <th className="py-2 px-2 text-xs uppercase tracking-wider text-muted">
                    Slug · Domínio
                  </th>
                  <th className="py-2 px-2 text-xs uppercase tracking-wider text-muted text-right">
                    Saldo
                  </th>
                  <th className="py-2 px-2 text-xs uppercase tracking-wider text-muted">
                    Status
                  </th>
                  <th className="py-2 px-2 text-xs uppercase tracking-wider text-muted">
                    Origem
                  </th>
                  <th className="py-2 px-2 text-xs uppercase tracking-wider text-muted"></th>
                </tr>
              </thead>
              <tbody>
                {tenantsList.map((t) => {
                  const saldo = saldoMap.get(t.id) ?? 0;
                  const saldoClass =
                    saldo <= 0
                      ? "text-red-600"
                      : saldo < 10000
                      ? "text-orange-600"
                      : "text-cdl-blue";
                  return (
                    <tr key={t.id} className="border-b border-border/50">
                      <td className="py-2 px-2">
                        <div className="font-medium text-cdl-blue">{t.nome}</div>
                        <div className="text-xs text-muted">
                          {t.admin_email ?? "—"}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-xs">
                        <code className="bg-zinc-100 px-1 rounded">{t.slug}</code>
                        {t.dominio ? (
                          <div className="text-muted mt-0.5">{t.dominio}</div>
                        ) : null}
                      </td>
                      <td
                        className={`py-2 px-2 text-right font-mono font-bold ${saldoClass}`}
                      >
                        {formatarReais(saldo)}
                      </td>
                      <td className="py-2 px-2">
                        {t.ativo ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-cdl-green/15 text-cdl-green-dark inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Ativo
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Bloqueado
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-xs text-muted">
                        {t.criada_via ?? "—"}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <Link
                          href={`/super/tenants/${t.id}`}
                          className="text-xs text-cdl-blue hover:underline"
                        >
                          Detalhes →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {tenantsList.length === 0 && (
              <p className="text-center text-muted py-8 text-sm">
                Nenhum tenant cadastrado ainda.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
