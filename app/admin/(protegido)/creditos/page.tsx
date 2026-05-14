import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Plus, TrendingDown, Vote, MessageSquare, Award, Wrench } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getSaldo, formatarReais } from "@/lib/creditos";
import { AplicarCupom } from "./AplicarCupom";

export const dynamic = "force-dynamic";

type GastoRow = {
  motivo: string;
  total_centavos: number;
  qtd: number;
};

export default async function CreditosPage() {
  const tenant = await getCurrentTenant();
  const saldo = await getSaldo(tenant.id);
  const supabase = createSupabaseAdminClient();

  // Inicio do mes corrente em America/Sao_Paulo (UTC-3)
  const agora = new Date();
  const inicioMesLocal = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    1,
    0,
    0,
    0
  );
  const inicioMesUtc = new Date(
    inicioMesLocal.getTime() + 3 * 60 * 60 * 1000
  ).toISOString();

  const [
    { data: transacoes },
    { data: pagamentos },
    { data: gastosMes },
    { data: gastosTotal },
  ] = await Promise.all([
    supabase
      .from("transacoes_credito")
      .select("id, valor_centavos, motivo, descricao, saldo_apos_centavos, criado_em")
      .eq("tenant_id", tenant.id)
      .order("criado_em", { ascending: false })
      .limit(30),
    supabase
      .from("pagamentos")
      .select("id, valor_centavos, status, metodo, criado_em, pago_em, mp_init_point")
      .eq("tenant_id", tenant.id)
      .order("criado_em", { ascending: false })
      .limit(10),
    supabase.rpc("gastos_resumo_tenant", {
      p_tenant_id: tenant.id,
      p_desde: inicioMesUtc,
    }),
    supabase.rpc("gastos_resumo_tenant", {
      p_tenant_id: tenant.id,
      p_desde: "1970-01-01T00:00:00Z",
    }),
  ]);

  const gastosMesList = (gastosMes ?? []) as GastoRow[];
  const gastosTotalList = (gastosTotal ?? []) as GastoRow[];
  const totalMes = gastosMesList.reduce((a, b) => a + (b.total_centavos ?? 0), 0);
  const totalAcumulado = gastosTotalList.reduce(
    (a, b) => a + (b.total_centavos ?? 0),
    0
  );

  const saldoBaixo = saldo < 10000; // < R$ 100
  const saldoZerado = saldo <= 0;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cdl-blue flex items-center gap-3">
          <Wallet className="w-7 h-7 text-cdl-green" />
          Créditos
        </h1>
        <p className="text-muted mt-1">
          Saldo prépago da sua campanha. Cada voto e mensagem é debitado em tempo real.
        </p>
      </header>

      {/* Saldo + CTA */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="kicker text-cdl-blue/60 text-xs uppercase tracking-widest mb-1">
                Saldo atual
              </p>
              <p
                className={`font-display text-4xl font-bold ${
                  saldoZerado
                    ? "text-red-600"
                    : saldoBaixo
                    ? "text-orange-600"
                    : "text-cdl-blue"
                }`}
              >
                {formatarReais(saldo)}
              </p>
              {saldoZerado ? (
                <p className="text-sm text-red-600 mt-2">
                  ⚠ Sua campanha está pausada. Recarregue pra voltar a aceitar votos.
                </p>
              ) : saldoBaixo ? (
                <p className="text-sm text-orange-600 mt-2">
                  ⚠ Saldo baixo. Recarregue antes que zere.
                </p>
              ) : null}
            </div>
            <Link
              href="/admin/creditos/comprar"
              className="h-12 px-6 inline-flex items-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark"
            >
              <Plus className="w-5 h-5" />
              Recarregar
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Aplicar cupom promocional */}
      <AplicarCupom />

      {/* Resumo de gastos */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-cdl-blue flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-cdl-blue/70" />
              Resumo de gastos
            </h2>
            <p className="text-xs text-muted">
              {agora.toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
                timeZone: "America/Sao_Paulo",
              })}
            </p>
          </div>

          {gastosMesList.length === 0 ? (
            <p className="text-sm text-muted py-2">
              Nenhum gasto registrado neste mês ainda.
            </p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-2 mb-4">
                {gastosMesList.map((g) => (
                  <GastoRow key={g.motivo} motivo={g.motivo} row={g} />
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="text-sm font-semibold text-cdl-blue">
                  Total no mês
                </span>
                <span className="font-mono font-bold text-cdl-blue">
                  {formatarReais(totalMes)}
                </span>
              </div>
            </>
          )}

          {totalAcumulado > totalMes && (
            <p className="text-xs text-muted mt-3 pt-3 border-t border-border/30">
              Acumulado desde o início:{" "}
              <span className="font-mono font-bold">
                {formatarReais(totalAcumulado)}
              </span>{" "}
              em{" "}
              {gastosTotalList
                .reduce((a, b) => a + (b.qtd ?? 0), 0)
                .toLocaleString("pt-BR")}{" "}
              movimentações
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabela de precos rapida */}
      <Card className="mb-6">
        <CardContent>
          <h2 className="font-display text-lg font-bold text-cdl-blue mb-3">
            O que cada coisa custa
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span>Voto sem SPC e sem WhatsApp</span>
              <span className="font-mono font-bold">R$ 0,20</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span>Voto validado por SPC</span>
              <span className="font-mono font-bold">R$ 0,25</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span>Voto SPC + WhatsApp/mailing</span>
              <span className="font-mono font-bold">R$ 0,60</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span>Marketing extra (parcial/incentivo)</span>
              <span className="font-mono font-bold">R$ 0,80</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span>Taxa por campanha (1x)</span>
              <span className="font-mono font-bold">R$ 500,00</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span>Manutenção pós-campanha</span>
              <span className="font-mono font-bold">R$ 200/mês</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagamentos recentes */}
      {pagamentos && pagamentos.length > 0 && (
        <Card className="mb-6">
          <CardContent>
            <h2 className="font-display text-lg font-bold text-cdl-blue mb-3">
              Pagamentos recentes
            </h2>
            <div className="divide-y divide-border/50">
              {pagamentos.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center py-2 text-sm"
                >
                  <div>
                    <span className="font-mono font-bold">
                      {formatarReais(p.valor_centavos)}
                    </span>
                    <span className="text-muted ml-2">
                      {new Date(p.criado_em).toLocaleString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        p.status === "pago"
                          ? "bg-cdl-green/15 text-cdl-green-dark"
                          : p.status === "pendente"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {p.status}
                    </span>
                    {p.status === "pendente" && p.mp_init_point ? (
                      <a
                        href={p.mp_init_point}
                        target="_blank"
                        rel="noopener"
                        className="text-xs text-cdl-blue hover:underline"
                      >
                        Pagar →
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de uso */}
      <Card>
        <CardContent>
          <h2 className="font-display text-lg font-bold text-cdl-blue mb-3">
            Últimas movimentações
          </h2>
          {!transacoes || transacoes.length === 0 ? (
            <p className="text-sm text-muted">
              Nenhuma transação ainda. Recarregue créditos pra começar.
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {transacoes.map((t) => (
                <div
                  key={t.id}
                  className="flex justify-between items-center py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    {t.valor_centavos > 0 ? (
                      <ArrowDownToLine className="w-4 h-4 text-cdl-green-dark" />
                    ) : (
                      <ArrowUpFromLine className="w-4 h-4 text-zinc-500" />
                    )}
                    <div>
                      <span className="font-medium">{labelMotivo(t.motivo)}</span>
                      {t.descricao ? (
                        <span className="text-muted ml-2 text-xs">{t.descricao}</span>
                      ) : null}
                      <div className="text-xs text-muted">
                        {new Date(t.criado_em).toLocaleString("pt-BR", {
                          timeZone: "America/Sao_Paulo",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-mono font-bold ${
                        t.valor_centavos > 0 ? "text-cdl-green-dark" : "text-zinc-700"
                      }`}
                    >
                      {t.valor_centavos > 0 ? "+" : ""}
                      {formatarReais(t.valor_centavos)}
                    </div>
                    <div className="text-xs text-muted">
                      saldo: {formatarReais(t.saldo_apos_centavos)}
                    </div>
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

function labelMotivo(motivo: string): string {
  const mapa: Record<string, string> = {
    recarga: "Recarga via Mercado Pago",
    voto_minimo: "Voto (sem SPC)",
    voto_spc: "Voto + SPC",
    voto_spc_whatsapp: "Voto + SPC + WhatsApp",
    marketing: "Marketing (incentivo/parcial/empate)",
    taxa_campanha: "Taxa de campanha",
    manutencao: "Manutenção pós-campanha",
    cortesia: "Cortesia",
    estorno: "Estorno",
    reembolso: "Reembolso",
  };
  return mapa[motivo] ?? motivo;
}

function iconeMotivo(motivo: string) {
  if (motivo.startsWith("voto"))
    return <Vote className="w-4 h-4 text-cdl-green-dark" />;
  if (motivo === "marketing")
    return <MessageSquare className="w-4 h-4 text-purple-600" />;
  if (motivo === "taxa_campanha")
    return <Award className="w-4 h-4 text-cdl-yellow-dark" />;
  if (motivo === "manutencao")
    return <Wrench className="w-4 h-4 text-zinc-600" />;
  return <TrendingDown className="w-4 h-4 text-zinc-500" />;
}

function GastoRow({
  motivo,
  row,
}: {
  motivo: string;
  row: { total_centavos: number; qtd: number };
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-cream-200/50 px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        {iconeMotivo(motivo)}
        <div className="min-w-0">
          <p className="text-sm font-medium text-cdl-blue truncate">
            {labelMotivo(motivo)}
          </p>
          <p className="text-xs text-muted">
            {row.qtd.toLocaleString("pt-BR")}{" "}
            {row.qtd === 1 ? "movimentação" : "movimentações"}
          </p>
        </div>
      </div>
      <span className="font-mono font-bold text-zinc-800 tabular-nums shrink-0 ml-2">
        {(row.total_centavos / 100).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          style: "currency",
          currency: "BRL",
        })}
      </span>
    </div>
  );
}
