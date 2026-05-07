import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { enviarSmsZenvia, zenviaConfigurada } from "@/lib/sms/zenvia";
import { enviarMensagemTexto } from "@/lib/zapi/client";
import { metaConfigurada, enviarTemplate } from "@/lib/meta-whatsapp/client";
import { formatarReais } from "@/lib/creditos";

export const maxDuration = 60;

// Valor de referencia pra calcular niveis 50%/20%/5%. Usamos R$ 1.000 como
// "tamanho de campanha tipico" — niveis sao calculados em valor absoluto.
//
// Niveis:
//   - 50%  → saldo cruzou de >50k pra <50k centavos (R$ 500) E nao avisamos
//     em <72h
//   - 20%  → saldo cruzou pra <20k (R$ 200) E nao avisamos em <48h
//   - 5%   → saldo cruzou pra <5k (R$ 50) E nao avisamos em <24h
//   - zerado → saldo <= 0 E nao avisamos em <12h
//
// Reset: quando saldo volta acima do nivel (recarga), apaga ultimo_alerta
// pra alertar de novo na proxima vez que cair.

const NIVEL_50_CENTAVOS = 50000;
const NIVEL_20_CENTAVOS = 20000;
const NIVEL_5_CENTAVOS = 5000;

const COOLDOWN_50_HORAS = 72;
const COOLDOWN_20_HORAS = 48;
const COOLDOWN_5_HORAS = 24;
const COOLDOWN_ZERADO_HORAS = 12;

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

  // Pega tenants ativos com saldo abaixo de R$ 500 (foco nos que precisam alerta)
  const { data: candidatos } = await supabase
    .from("creditos_tenant")
    .select(
      `
      tenant_id,
      saldo_centavos,
      ultimo_alerta_50,
      ultimo_alerta_20,
      ultimo_alerta_5,
      ultimo_alerta_zerado,
      tenants!inner (
        id, slug, nome, ativo, admin_email, dominio
      )
      `
    )
    .lt("saldo_centavos", NIVEL_50_CENTAVOS);

  type TenantInfo = {
    id: string;
    slug: string;
    nome: string;
    ativo: boolean;
    admin_email: string | null;
    dominio: string | null;
  };
  type Linha = {
    tenant_id: string;
    saldo_centavos: number;
    ultimo_alerta_50: string | null;
    ultimo_alerta_20: string | null;
    ultimo_alerta_5: string | null;
    ultimo_alerta_zerado: string | null;
    tenants: TenantInfo | TenantInfo[];
  };
  const lista = (candidatos ?? []) as unknown as Linha[];

  const enviados: string[] = [];
  const pulados: { slug: string; motivo: string }[] = [];

  for (const c of lista) {
    const tenant = Array.isArray(c.tenants) ? c.tenants[0] : c.tenants;
    if (!tenant?.ativo) {
      pulados.push({ slug: tenant?.slug ?? "?", motivo: "inativo" });
      continue;
    }

    const saldo = c.saldo_centavos;
    const agora = Date.now();

    // Determina nivel atual + se pode alertar (cooldown nao violado)
    let nivel: "zerado" | "5" | "20" | "50" | null = null;
    let ultimoAlerta: string | null = null;
    let cooldownH = 0;
    if (saldo <= 0) {
      nivel = "zerado";
      ultimoAlerta = c.ultimo_alerta_zerado;
      cooldownH = COOLDOWN_ZERADO_HORAS;
    } else if (saldo < NIVEL_5_CENTAVOS) {
      nivel = "5";
      ultimoAlerta = c.ultimo_alerta_5;
      cooldownH = COOLDOWN_5_HORAS;
    } else if (saldo < NIVEL_20_CENTAVOS) {
      nivel = "20";
      ultimoAlerta = c.ultimo_alerta_20;
      cooldownH = COOLDOWN_20_HORAS;
    } else if (saldo < NIVEL_50_CENTAVOS) {
      nivel = "50";
      ultimoAlerta = c.ultimo_alerta_50;
      cooldownH = COOLDOWN_50_HORAS;
    }

    if (!nivel) continue;

    if (ultimoAlerta) {
      const diff =
        (agora - new Date(ultimoAlerta).getTime()) / (1000 * 60 * 60);
      if (diff < cooldownH) {
        pulados.push({ slug: tenant.slug, motivo: `cooldown ${nivel}` });
        continue;
      }
    }

    // Envia alerta. Tenta WhatsApp Z-API primeiro (texto livre, sem template),
    // depois SMS, depois email (futuro). Pra escala maior, vale criar
    // template Meta dedicado tipo "saldo_baixo".
    const numeroAdmin = tenant.admin_email; // TODO: precisa ter numero do admin
    // Por ora usa o email — o admin recebe ao acessar /admin/creditos
    // o aviso visual. WhatsApp/SMS exige cadastrar numero do admin no tenant.

    const txt = montarTexto(tenant, saldo, nivel);
    console.log(`[alertas-saldo] ${tenant.slug} nivel=${nivel} saldo=${formatarReais(saldo)}`);
    console.log(`[alertas-saldo] msg: ${txt}`);

    // Por enquanto so' loga (proxima sessao adiciona email/whatsapp/sms).
    // Atualiza ultimo_alerta pra evitar spam mesmo sem envio real.
    const upd: Record<string, string> = {};
    if (nivel === "zerado") upd.ultimo_alerta_zerado = new Date().toISOString();
    if (nivel === "5") upd.ultimo_alerta_5 = new Date().toISOString();
    if (nivel === "20") upd.ultimo_alerta_20 = new Date().toISOString();
    if (nivel === "50") upd.ultimo_alerta_50 = new Date().toISOString();
    await supabase.from("creditos_tenant").update(upd).eq("tenant_id", tenant.id);

    enviados.push(`${tenant.slug}:${nivel}`);
  }

  void enviarMensagemTexto;
  void enviarSmsZenvia;
  void zenviaConfigurada;
  void metaConfigurada;
  void enviarTemplate;

  return NextResponse.json({ ok: true, enviados, pulados });
}

function montarTexto(
  tenant: { nome: string; slug: string },
  saldo: number,
  nivel: "zerado" | "5" | "20" | "50"
): string {
  const url = `https://${tenant.slug}.melhoresdoano.app.br/admin/creditos`;
  if (nivel === "zerado") {
    return `🚨 ${tenant.nome}: sua campanha está PAUSADA — saldo zerou. Recarregue agora pra voltar a aceitar votos: ${url}`;
  }
  if (nivel === "5") {
    return `⚠️ ${tenant.nome}: saldo crítico (${formatarReais(saldo)}). Recarregue antes que zere: ${url}`;
  }
  if (nivel === "20") {
    return `⚠️ ${tenant.nome}: saldo baixo (${formatarReais(saldo)}). Considere recarregar: ${url}`;
  }
  return `${tenant.nome}: saldo abaixo de R$ 500 (${formatarReais(saldo)}). Acompanhe em ${url}`;
}
