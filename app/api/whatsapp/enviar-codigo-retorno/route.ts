import { NextResponse } from "next/server";
import { getPreRetorno } from "@/lib/sessao";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  enviarMensagemTexto,
  gerarCodigoVerificacao,
  verificarStatus,
} from "@/lib/zapi/client";
import {
  enviarTemplateAutenticacao,
  metaConfigurada,
} from "@/lib/meta-whatsapp/client";
import { enviarSmsZenvia, zenviaConfigurada } from "@/lib/sms/zenvia";
import { getClientIp } from "@/lib/utils";

const META_TEMPLATE_OTP =
  process.env.META_TEMPLATE_OTP ?? "codigo_verificacao_2025";
const META_TEMPLATE_LANG = process.env.META_TEMPLATE_LANG ?? "pt_BR";

// Envia OTP pro celular ja cadastrado do votante de retorno. Usuario nao
// pode trocar o numero — usamos exatamente o que ja esta em votantes.whatsapp.
export async function POST(req: Request) {
  const votanteId = await getPreRetorno();
  if (!votanteId) {
    return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const ip = getClientIp(req.headers);

  // Rate limit: 3 envios por IP em 10min
  const dezMin = new Date(Date.now() - 10 * 60_000).toISOString();
  const { count } = await supabase
    .from("rate_limit_ip")
    .select("*", { head: true, count: "exact" })
    .eq("ip", ip)
    .eq("acao", "whatsapp_retorno_enviar")
    .gte("criado_em", dezMin);

  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: "Você já solicitou códigos demais. Aguarde alguns minutos." },
      { status: 429 }
    );
  }

  await supabase.from("rate_limit_ip").insert({ ip, acao: "whatsapp_retorno_enviar" });

  // Carrega votante e o whatsapp ja cadastrado (nunca aceitamos parametro
  // novo de numero — anti-fraude).
  const { data: votante } = await supabase
    .from("votantes")
    .select("id, whatsapp")
    .eq("id", votanteId)
    .maybeSingle();

  if (!votante || !votante.whatsapp) {
    return NextResponse.json(
      { error: "Cadastro sem WhatsApp registrado. Contate o suporte." },
      { status: 400 }
    );
  }

  const whatsapp = votante.whatsapp;
  const codigo = gerarCodigoVerificacao();
  const expiraEm = new Date(Date.now() + 10 * 60_000).toISOString();

  // Invalida codigos anteriores ainda pendentes deste votante
  await supabase
    .from("whatsapp_codigos")
    .update({ validado: false, expira_em: new Date(0).toISOString() })
    .eq("votante_id", votante.id)
    .eq("validado", false);

  await supabase.from("whatsapp_codigos").insert({
    votante_id: votante.id,
    whatsapp,
    codigo,
    expira_em: expiraEm,
  });

  // Cascata Meta > Z-API > SMS Zenvia.
  let envioOk = false;
  let canal: "meta" | "zapi" | "sms" | null = null;

  if (metaConfigurada()) {
    const r = await enviarTemplateAutenticacao(
      whatsapp,
      META_TEMPLATE_OTP,
      META_TEMPLATE_LANG,
      codigo
    );
    if (r.ok) {
      envioOk = true;
      canal = "meta";
    }
  }

  if (!envioOk) {
    const status = await verificarStatus();
    if (status.conectado) {
      const mensagem =
        `*Melhores do Ano CDL Aracaju 2025*\n\n` +
        `Olá! Seu código de validação para continuar votando é:\n\n` +
        `*${codigo}*\n\n` +
        `O código expira em 10 minutos.`;
      const r = await enviarMensagemTexto(whatsapp, mensagem);
      if (r.ok) {
        envioOk = true;
        canal = "zapi";
      }
    }
  }

  if (!envioOk && zenviaConfigurada()) {
    const sms = `Codigo CDL Aracaju 2025: ${codigo}. Valido por 10 minutos. Nao compartilhe.`;
    const r = await enviarSmsZenvia(whatsapp, sms);
    if (r.ok) {
      envioOk = true;
      canal = "sms";
    }
  }

  if (!envioOk) {
    return NextResponse.json(
      {
        error:
          "Não conseguimos enviar o código no momento. Tente novamente em alguns minutos.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, canal });
}
