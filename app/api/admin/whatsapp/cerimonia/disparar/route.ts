import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { enviarMensagemTexto, verificarStatus } from "@/lib/zapi/client";
import { enviarSmsZenvia, zenviaConfigurada } from "@/lib/sms/zenvia";
import { enviarTemplate, metaConfigurada } from "@/lib/meta-whatsapp/client";
import { getCurrentTenant } from "@/lib/tenant/resolver";

const META_TEMPLATE_CERIMONIA =
  process.env.META_TEMPLATE_CERIMONIA ?? "cerimonia_certificados_2025";
const META_TEMPLATE_LANG = process.env.META_TEMPLATE_LANG ?? "pt_BR";

// Pacing 2-5s significa ~50 envios em ~5min. Mesmo limite do parcial/incentivo.
export const maxDuration = 300;
const LOTE_MAX = 50;

const Body = z.object({
  votante_ids: z.array(z.string().uuid()).min(1).max(LOTE_MAX),
});

// Mensagem texto fallback (Z-API ou SMS) — usada quando Meta nao
// estiver configurada. Substitui pela primeira pessoa.
function montarMensagem(votanteNome: string, nomeOrgao: string): string {
  const primeiroNome =
    (votanteNome.split(" ")[0] ?? "").trim() || "amigo(a)";
  return [
    `Olá ${primeiroNome}! 🏆`,
    "",
    `A entrega dos certificados Melhores do Ano ${nomeOrgao} 2025 acontece nos dias 13 e 14 de maio, das 8h às 18h, na sede da ${nomeOrgao}.`,
    "",
    "Como você votou nos vencedores, está convidado(a) a comparecer e celebrar com a gente. Os campeões que você ajudou a escolher agradecem!",
  ].join("\n");
}

function montarSms(votanteNome: string, nomeOrgao: string): string {
  const primeiroNome = (votanteNome.split(" ")[0] ?? "").trim() || "amigo";
  return `Ola ${primeiroNome}! Entrega dos certificados Melhores do Ano ${nomeOrgao} 2025: 13 e 14/05 das 8h as 18h na sede da ${nomeOrgao}. Voce votou nos vencedores!`;
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
  const supabase = createSupabaseAdminClient();

  const { data: votantes, error: vErr } = await supabase
    .from("votantes")
    .select("id, nome, whatsapp, whatsapp_validado, cerimonia_enviada_em")
    .in("id", parsed.data.votante_ids);

  if (vErr) {
    return NextResponse.json(
      { error: `Falha: ${vErr.message}` },
      { status: 500 }
    );
  }

  const elegiveis = (votantes ?? []).filter(
    (v) => v.whatsapp_validado && v.whatsapp && !v.cerimonia_enviada_em
  );

  // Nome curto pra exibir nas mensagens — "CDL Aracaju" para tenant default.
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

    let r;
    if (canal === "meta") {
      // Template tem 1 variavel: primeiro nome
      r = await enviarTemplate(
        v.whatsapp!,
        META_TEMPLATE_CERIMONIA,
        META_TEMPLATE_LANG,
        [primeiroNome]
      );
    } else if (canal === "zapi") {
      r = await enviarMensagemTexto(v.whatsapp!, montarMensagem(v.nome, nomeOrgao));
    } else {
      r = await enviarSmsZenvia(v.whatsapp!, montarSms(v.nome, nomeOrgao));
    }

    if (r.ok) {
      enviados += 1;
      await supabase
        .from("votantes")
        .update({ cerimonia_enviada_em: new Date().toISOString() })
        .eq("id", v.id);
    } else {
      falhas.push({
        votante_id: v.id,
        nome: v.nome,
        motivo: r.detalhe ?? "erro",
      });
    }

    // Pacing aleatorio 2-5s — mesmo padrao parcial/incentivo
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
