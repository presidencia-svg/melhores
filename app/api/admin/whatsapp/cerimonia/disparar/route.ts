import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { enviarMensagemTexto, verificarStatus } from "@/lib/zapi/client";
import { enviarSmsZenvia, zenviaConfigurada } from "@/lib/sms/zenvia";
import { enviarTemplate, metaConfigurada } from "@/lib/meta-whatsapp/client";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { debitarCredito, creditarCredito, PRECOS } from "@/lib/creditos";

const META_TEMPLATE_CERIMONIA =
  process.env.META_TEMPLATE_CERIMONIA ?? "cerimonia_certificados_2025";
const META_TEMPLATE_LANG = process.env.META_TEMPLATE_LANG ?? "pt_BR";

// Pacing 2-5s significa ~50 envios em ~5min. Mesmo limite do parcial/incentivo.
export const maxDuration = 300;
const LOTE_MAX = 50;
const MAX_CAMPEOES_NA_MSG = 3;

const Body = z.object({
  payloads: z
    .array(
      z.object({
        votante_id: z.string().uuid(),
        campeoes_nomes: z.array(z.string()).min(1),
      })
    )
    .min(1)
    .max(LOTE_MAX),
});

// Frase unica: votante recebe e e' instruido a passar o recado pros
// vencedores que ele ajudou a eleger.
function montarMensagem(
  votanteNome: string,
  campeoes: string[],
  nomeOrgao: string
): string {
  const primeiroNome =
    (votanteNome.split(" ")[0] ?? "").trim() || "amigo(a)";
  const lista = campeoes.slice(0, MAX_CAMPEOES_NA_MSG).join(", ");
  return `Olá ${primeiroNome}! Você votou em ${lista}, vencedor(es) do Melhores do Ano ${nomeOrgao} 2025, e agora o certificado já pode ser retirado na sede da ${nomeOrgao} nos dias 13 e 14 de maio, das 8h às 18h — por favor, passe o recado pra quem você ajudou a eleger!`;
}

function montarSms(
  votanteNome: string,
  campeoes: string[],
  nomeOrgao: string
): string {
  const primeiroNome = (votanteNome.split(" ")[0] ?? "").trim() || "amigo";
  const lista = campeoes.slice(0, MAX_CAMPEOES_NA_MSG).join(", ");
  return `Ola ${primeiroNome}! Voce votou em ${lista}, vencedor(es) do Melhores do Ano ${nomeOrgao} 2025. Certificado pode ser retirado na sede da ${nomeOrgao} dias 13 e 14/05 das 8h as 18h - passe o recado!`;
}

// Var {{2}} do template Meta = nomes separados por virgula (texto plano).
function formatVar2(campeoes: string[]): string {
  return campeoes.slice(0, MAX_CAMPEOES_NA_MSG).join(", ");
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const tenant = await getCurrentTenant();
  const edicaoStatus = await getEdicaoStatus(tenant.id);
  const edicaoId =
    edicaoStatus.status !== "sem_edicao" ? edicaoStatus.edicao.id : null;
  const supabase = createSupabaseAdminClient();

  // Cria map de id -> campeoes pra usar depois sem 2 lookups
  const campeoesPorId = new Map<string, string[]>();
  for (const p of parsed.data.payloads) {
    campeoesPorId.set(p.votante_id, p.campeoes_nomes);
  }

  const ids = parsed.data.payloads.map((p) => p.votante_id);
  const { data: votantes, error: vErr } = await supabase
    .from("votantes")
    .select("id, nome, whatsapp, whatsapp_validado, cerimonia_enviada_em")
    .in("id", ids);

  if (vErr) {
    return NextResponse.json(
      { error: `Falha: ${vErr.message}` },
      { status: 500 }
    );
  }

  const elegiveis = (votantes ?? []).filter(
    (v) => v.whatsapp_validado && v.whatsapp && !v.cerimonia_enviada_em
  );

  const nomeOrgao = tenant.nome;

  // Decide canal: Meta WhatsApp Cloud API > Z-API > SMS Zenvia.
  const usarMeta = metaConfigurada();
  let usarZapi = false;
  let usarSms = false;
  if (!usarMeta) {
    const status = await verificarStatus();
    usarZapi = status.conectado;
    if (!usarZapi) {
      usarSms = zenviaConfigurada();
    }
  }
  if (!usarMeta && !usarZapi && !usarSms) {
    return NextResponse.json(
      {
        error:
          "Nenhum canal disponível. Configure META_WHATSAPP_TOKEN/META_WHATSAPP_PHONE_IDS, reconecte a Z-API ou configure Zenvia.",
      },
      { status: 503 }
    );
  }
  const canal = usarMeta ? "meta" : usarZapi ? "zapi" : "sms";

  let enviados = 0;
  const falhas: { votante_id: string; nome: string; motivo: string }[] = [];

  for (const v of elegiveis) {
    const primeiroNome =
      (v.nome.split(" ")[0] ?? "").trim() || "amigo(a)";
    const campeoes = campeoesPorId.get(v.id) ?? [];
    if (campeoes.length === 0) {
      falhas.push({
        votante_id: v.id,
        nome: v.nome,
        motivo: "sem campeoes no payload",
      });
      continue;
    }

    // Debita R$ 0,80 da wallet do tenant antes de enviar.
    const debito = await debitarCredito({
      tenantId: tenant.id,
      motivo: "marketing",
      descricao: `Cerimônia: ${v.nome}`,
      votanteId: v.id,
      edicaoId: edicaoId ?? undefined,
    });
    if (!debito.ok) {
      falhas.push({
        votante_id: v.id,
        nome: v.nome,
        motivo: `saldo insuficiente (${debito.motivo})`,
      });
      continue;
    }

    let r;
    if (canal === "meta") {
      // Template tem 2 variaveis: {{1}} primeiro nome, {{2}} lista campeoes
      r = await enviarTemplate(
        v.whatsapp!,
        META_TEMPLATE_CERIMONIA,
        META_TEMPLATE_LANG,
        [primeiroNome, formatVar2(campeoes)]
      );
    } else if (canal === "zapi") {
      r = await enviarMensagemTexto(
        v.whatsapp!,
        montarMensagem(v.nome, campeoes, nomeOrgao)
      );
    } else {
      r = await enviarSmsZenvia(v.whatsapp!, montarSms(v.nome, campeoes, nomeOrgao));
    }

    if (r.ok) {
      enviados += 1;
      await supabase
        .from("votantes")
        .update({ cerimonia_enviada_em: new Date().toISOString() })
        .eq("id", v.id);
    } else {
      // Envio falhou apos cobrar — estorna pra wallet
      try {
        await creditarCredito({
          tenantId: tenant.id,
          valorCentavos: PRECOS.marketing,
          motivo: "estorno",
          descricao: `Estorno cerimônia (envio falhou): ${v.nome}`,
        });
      } catch (err) {
        console.error("[cerimonia] estorno falhou:", err);
      }
      falhas.push({
        votante_id: v.id,
        nome: v.nome,
        motivo: r.detalhe ?? "erro",
      });
    }

    // Pacing aleatorio 2-5s
    const delayMs = 2000 + Math.floor(Math.random() * 3001);
    await new Promise((res) => setTimeout(res, delayMs));
  }

  return NextResponse.json({
    ok: true,
    total_alvo: elegiveis.length,
    enviados,
    falhas: falhas.length,
    detalhes_falhas: falhas,
    canal,
  });
}
