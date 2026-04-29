import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { enviarMensagemTexto, verificarStatus } from "@/lib/zapi/client";
import { enviarSmsZenvia, zenviaConfigurada } from "@/lib/sms/zenvia";
import { enviarTemplate, metaConfigurada } from "@/lib/meta-whatsapp/client";

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

type Elegivel = {
  votante_id: string;
  votante_nome: string;
  whatsapp: string;
  categoria_nome: string;
  subcategoria_id: string;
  subcategoria_nome: string;
  candidato_perdendo_id: string;
  candidato_perdendo_nome: string;
  candidato_perdendo_votos: number;
  candidato_lider_nome: string;
  candidato_lider_votos: number;
  diferenca: number;
};

// "18324" -> "19 mil"; "523" -> "523"; "1000" -> "1 mil".
// Arredonda PRA CIMA pro proximo milhar (excedente vira mil cheio).
function formatVotosMil(total: number): string {
  if (total <= 0) return "0";
  if (total < 1000) return total.toLocaleString("pt-BR");
  return `${Math.ceil(total / 1000).toLocaleString("pt-BR")} mil`;
}

// Dias completos desde inicio_votacao. Min 1.
function calcularDias(inicio: string | null | undefined): number {
  if (!inicio) return 1;
  const ms = Date.now() - new Date(inicio).getTime();
  return Math.max(1, Math.floor(ms / 86_400_000));
}

function formatDias(dias: number): string {
  return dias === 1 ? "1 dia" : `${dias} dias`;
}

function montarMensagem(
  e: Elegivel,
  votosFmt: string,
  diasFmt: string
): string {
  const primeiroNome = (e.votante_nome.split(" ")[0] ?? "").trim() || "amigo(a)";
  const empate = e.diferenca === 0;
  const diff = e.diferenca === 1 ? "1 voto" : `${e.diferenca} votos`;
  const linhaDisputa = empate
    ? `A disputa está empatada com ${e.candidato_lider_nome}.`
    : `${e.candidato_lider_nome} está na frente por só ${diff}.`;

  return [
    `🏆 Oi, ${primeiroNome}!`,
    "",
    `Os Melhores do Ano CDL Aracaju 2025 já passaram de ${votosFmt} votos em ${diasFmt} — obrigado pela sua participação!`,
    "",
    `Você votou em ${e.candidato_perdendo_nome} para Melhor ${e.subcategoria_nome}. ${linhaDisputa}`,
    "",
    `Compartilhe o link com seus contatos e ajude quem você votou:`,
    `🌐 https://votar.cdlaju.com.br`,
    "",
    `Cada voto faz diferença!`,
  ].join("\n");
}

// Versão curta sem acento, dentro de ~155 chars (1 segmento de SMS)
function montarSms(e: Elegivel, votosFmt: string, diasFmt: string): string {
  const primeiroNome = (e.votante_nome.split(" ")[0] ?? "").trim() || "amigo";
  const trecho = e.diferenca === 0
    ? `votacao empatada`
    : `disputa apertada por ${e.diferenca} ${e.diferenca === 1 ? "voto" : "votos"}`;
  return `Ola ${primeiroNome}! ${votosFmt} votos em ${diasFmt}. Voce votou em ${e.candidato_perdendo_nome} (${e.subcategoria_nome}). ${trecho}. Compartilhe: votar.cdlaju.com.br`;
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
    const primeiroNome = (e.votante_nome.split(" ")[0] ?? "").trim() || "amigo(a)";
    const diff =
      e.diferenca === 0
        ? "(empatado)"
        : e.diferenca === 1
          ? "1 voto"
          : `${e.diferenca} votos`;
    let r;
    if (canal === "meta") {
      r = await enviarTemplate(e.whatsapp, META_TEMPLATE_INCENTIVO, META_TEMPLATE_LANG, [
        primeiroNome,
        e.candidato_perdendo_nome,
        e.subcategoria_nome,
        e.candidato_lider_nome,
        diff,
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
      await supabase
        .from("votantes")
        .update({ incentivo_enviado_em: new Date().toISOString() })
        .eq("id", e.votante_id);
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
