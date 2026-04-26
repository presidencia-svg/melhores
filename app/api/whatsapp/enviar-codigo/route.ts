import { NextResponse } from "next/server";
import { z } from "zod";
import { getVotanteSessao } from "@/lib/sessao";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { enviarMensagemTexto, gerarCodigoVerificacao } from "@/lib/zapi/client";
import { getClientIp } from "@/lib/utils";

const Body = z.object({ whatsapp: z.string().min(10).max(13) });

export async function POST(req: Request) {
  const sessao = await getVotanteSessao();
  if (!sessao) {
    return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const ip = getClientIp(req.headers);

  // Rate limit: 3 envios por IP em 10min
  const dezMin = new Date(Date.now() - 10 * 60_000).toISOString();
  const { count } = await supabase
    .from("rate_limit_ip")
    .select("*", { head: true, count: "exact" })
    .eq("ip", ip)
    .eq("acao", "whatsapp_enviar")
    .gte("criado_em", dezMin);

  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: "Você já solicitou códigos demais. Aguarde alguns minutos." },
      { status: 429 }
    );
  }

  await supabase.from("rate_limit_ip").insert({ ip, acao: "whatsapp_enviar" });

  const whatsapp = parsed.data.whatsapp.replace(/\D/g, "");
  const codigo = gerarCodigoVerificacao();
  const expiraEm = new Date(Date.now() + 10 * 60_000).toISOString();

  // Salva código (invalida códigos anteriores)
  await supabase
    .from("whatsapp_codigos")
    .update({ validado: false, expira_em: new Date(0).toISOString() })
    .eq("votante_id", sessao.id)
    .eq("validado", false);

  await supabase.from("whatsapp_codigos").insert({
    votante_id: sessao.id,
    whatsapp,
    codigo,
    expira_em: expiraEm,
  });

  await supabase
    .from("votantes")
    .update({ whatsapp, whatsapp_validado: false })
    .eq("id", sessao.id);

  // Envia via Z-API
  const mensagem =
    `🏆 *Melhores do Ano CDL Aracaju 2025*\n\n` +
    `Olá! Seu código de validação é:\n\n` +
    `*${codigo}*\n\n` +
    `Use esse código para confirmar seu WhatsApp e receber em primeira mão os campeões. ` +
    `O código expira em 10 minutos.`;

  const envio = await enviarMensagemTexto(whatsapp, mensagem);
  if (!envio.ok) {
    return NextResponse.json(
      { error: "Não conseguimos enviar o código. Confira o número e tente novamente." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
