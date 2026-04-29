import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { enviarMensagemTexto, verificarStatus } from "@/lib/zapi/client";
import { enviarSmsZenvia, zenviaConfigurada } from "@/lib/sms/zenvia";
import { enviarTemplate, metaConfigurada } from "@/lib/meta-whatsapp/client";
import {
  Elegivel,
  calcularDias,
  diferencaParaTemplate,
  formatDias,
  formatVotosMil,
  montarMensagem,
  montarSms,
  primeiroNomeDe,
} from "@/lib/incentivo/messages";

const META_TEMPLATE_INCENTIVO =
  process.env.META_TEMPLATE_INCENTIVO ?? "incentivo_voto_2025";
const META_TEMPLATE_LANG = process.env.META_TEMPLATE_LANG ?? "pt_BR";

// Pacing 2-5s significa ~50 envios em ~5min (limite do Vercel Pro).
export const maxDuration = 300;
const LOTE_MAX = 50;

const Body = z.object({
  threshold: z.number().int().min(0).max(100).default(5),
  cooldown: z.number().int().min(0).max(1440).default(30),
  votante_ids: z.array(z.string().uuid()).optional(),
});

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const [
    { data: elegiveis, error },
    { count: totalVotos },
    { data: edicao },
  ] = await Promise.all([
    supabase.rpc("incentivo_elegives", {
      p_threshold: parsed.data.threshold,
      p_min_minutos_apos_voto: parsed.data.cooldown,
    }),
    supabase.from("votos").select("*", { head: true, count: "exact" }),
    supabase
      .from("edicao")
      .select("inicio_votacao")
      .eq("ativa", true)
      .order("ano", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (error) {
    return NextResponse.json(
      { error: `Falha ao buscar elegíveis: ${error.message}` },
      { status: 500 }
    );
  }

  const votosFmt = formatVotosMil(totalVotos ?? 0);
  const diasFmt = formatDias(calcularDias(edicao?.inicio_votacao));

  const lista = (elegiveis ?? []) as Elegivel[];
  const filtroIds = parsed.data.votante_ids;
  const alvos = filtroIds
    ? lista.filter((e) => filtroIds.includes(e.votante_id))
    : lista;

  // Dedup por votante: 1 mensagem por pessoa, escolhendo a subcategoria com
  // menor diferença (mais acirrada) — mais relevante.
  const porVotante = new Map<string, Elegivel>();
  for (const e of alvos) {
    const atual = porVotante.get(e.votante_id);
    if (!atual || e.diferenca < atual.diferenca) {
      porVotante.set(e.votante_id, e);
    }
  }
  const todosAlvos = Array.from(porVotante.values());
  // limita por lote para caber no maxDuration (pacing 4-12s)
  const finalAlvos = todosAlvos.slice(0, LOTE_MAX);
  const restantes = Math.max(0, todosAlvos.length - finalAlvos.length);

  // Decide canal: Meta WhatsApp Cloud API > Z-API > SMS Zenvia.
  // Meta exige template aprovado; Z-API permite mensagem livre; SMS é fallback curto.
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

  for (const e of finalAlvos) {
    let r;
    if (canal === "meta") {
      r = await enviarTemplate(e.whatsapp, META_TEMPLATE_INCENTIVO, META_TEMPLATE_LANG, [
        primeiroNomeDe(e.votante_nome),
        e.candidato_perdendo_nome,
        e.subcategoria_nome,
        e.candidato_lider_nome,
        diferencaParaTemplate(e.diferenca),
        votosFmt,
        diasFmt,
      ]);
    } else if (canal === "zapi") {
      r = await enviarMensagemTexto(e.whatsapp, montarMensagem(e, votosFmt, diasFmt));
    } else {
      r = await enviarSmsZenvia(e.whatsapp, montarSms(e, votosFmt, diasFmt));
    }
    if (r.ok) {
      enviados += 1;
      const agora = new Date().toISOString();
      await Promise.all([
        supabase
          .from("votantes")
          .update({ incentivo_enviado_em: agora })
          .eq("id", e.votante_id),
        supabase.from("incentivo_envios_log").insert({
          votante_id: e.votante_id,
          subcategoria_id: e.subcategoria_id,
          motivo: "manual",
          canal,
        }),
      ]);
    } else {
      falhas.push({
        votante_id: e.votante_id,
        nome: e.votante_nome,
        motivo: r.detalhe ?? "erro",
      });
    }
    // pacing aleatório entre 2-5s para evitar padrão de envio automatizado
    const delayMs = 2000 + Math.floor(Math.random() * 3001);
    await new Promise((res) => setTimeout(res, delayMs));
  }

  return NextResponse.json({
    ok: true,
    total_alvo: finalAlvos.length,
    enviados,
    falhas: falhas.length,
    detalhes_falhas: falhas,
    restantes,
    lote_max: LOTE_MAX,
    canal,
  });
}
