import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { debitarCredito, PRECOS } from "@/lib/creditos";

export const maxDuration = 60;

// Manutencao pos-campanha (R$ 200/mes) — cobra mensalmente todo tenant
// cuja edicao ativa ja encerrou. Roda diariamente; idempotente porque
// usa o ultimo timestamp de cobranca em transacoes_credito pra decidir
// se passa 30 dias desde a ultima taxa.
//
// Regra:
//   - Tenant ativo (tenants.ativo = true)
//   - Tem edicao com fim_votacao <= now() (campanha encerrada)
//   - Ultima manutencao foi ha >= 30 dias OU nunca foi cobrada e
//     fim_votacao foi ha >= 30 dias
//
// Se saldo insuficiente, falha o debito e registra na resposta — admin
// vai ver alerta de saldo via cron/alertas-saldo. Nao bloqueamos o
// tenant aqui — esse fluxo e responsabilidade do alerta de saldo.

function autorizado(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return req.headers.get("authorization") === `Bearer ${expected}`;
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}

async function handle(req: Request) {
  if (!autorizado(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const agora = new Date();
  const trintaDiasMs = 30 * 24 * 60 * 60 * 1000;

  // Pega todos os tenants ativos com edicao encerrada (fim_votacao <= now()).
  const { data: tenants, error: tErr } = await supabase
    .from("tenants")
    .select("id, slug, nome")
    .eq("ativo", true);
  if (tErr) {
    return NextResponse.json(
      { error: `Falha ao listar tenants: ${tErr.message}` },
      { status: 500 }
    );
  }

  type Resultado = {
    tenant_id: string;
    slug: string;
    motivo: "cobrado" | "ainda_no_prazo" | "saldo_insuficiente" | "sem_edicao_encerrada";
    detalhe?: string;
  };
  const resultados: Resultado[] = [];

  for (const t of tenants ?? []) {
    // Pega edicao mais recente encerrada
    const { data: edicao } = await supabase
      .from("edicao")
      .select("id, ano, nome, fim_votacao")
      .eq("tenant_id", t.id)
      .lte("fim_votacao", agora.toISOString())
      .order("fim_votacao", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!edicao) {
      resultados.push({
        tenant_id: t.id,
        slug: t.slug,
        motivo: "sem_edicao_encerrada",
      });
      continue;
    }

    // Ultima cobranca de manutencao desse tenant
    const { data: ultima } = await supabase
      .from("transacoes_credito")
      .select("criado_em")
      .eq("tenant_id", t.id)
      .eq("motivo", "manutencao")
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    const baseTs = ultima
      ? new Date(ultima.criado_em).getTime()
      : new Date(edicao.fim_votacao).getTime();
    const proximaCobranca = baseTs + trintaDiasMs;

    if (agora.getTime() < proximaCobranca) {
      resultados.push({
        tenant_id: t.id,
        slug: t.slug,
        motivo: "ainda_no_prazo",
        detalhe: `proxima em ${new Date(proximaCobranca).toISOString().slice(0, 10)}`,
      });
      continue;
    }

    const debito = await debitarCredito({
      tenantId: t.id,
      motivo: "manutencao",
      descricao: `Manutenção pós-campanha · ${edicao.nome}`,
      edicaoId: edicao.id,
    });

    if (debito.ok) {
      resultados.push({
        tenant_id: t.id,
        slug: t.slug,
        motivo: "cobrado",
        detalhe: `R$ ${(PRECOS.manutencao / 100).toFixed(2)} · saldo: ${debito.saldo_atual}`,
      });
    } else {
      resultados.push({
        tenant_id: t.id,
        slug: t.slug,
        motivo: "saldo_insuficiente",
        detalhe: debito.motivo,
      });
    }
  }

  const stats = {
    total_tenants: resultados.length,
    cobrados: resultados.filter((r) => r.motivo === "cobrado").length,
    no_prazo: resultados.filter((r) => r.motivo === "ainda_no_prazo").length,
    saldo_insuficiente: resultados.filter((r) => r.motivo === "saldo_insuficiente").length,
    sem_edicao: resultados.filter((r) => r.motivo === "sem_edicao_encerrada").length,
  };

  return NextResponse.json({ ok: true, stats, detalhes: resultados });
}
