import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { enviarMensagemTexto, verificarStatus } from "@/lib/zapi/client";
import { enviarSmsZenvia, zenviaConfigurada } from "@/lib/sms/zenvia";
import { enviarTemplate, metaConfigurada } from "@/lib/meta-whatsapp/client";
import {
  Elegivel,
  calcularDias,
  formatDias,
  formatVotosMil,
  montarMensagem,
  montarSms,
  primeiroNomeDe,
} from "@/lib/incentivo/messages";

export const maxDuration = 300;

const META_TEMPLATE_INCENTIVO_EMPATE =
  process.env.META_TEMPLATE_INCENTIVO_EMPATE ?? "incentivo_empate_2025";
const META_TEMPLATE_LANG = process.env.META_TEMPLATE_LANG ?? "pt_BR";

// Limites do disparo automatico
const COOLDOWN_HORAS = 48;             // 2 dias entre incentivos pra mesma pessoa
const CAP_HORA = 200;                  // max 200 envios na ultima hora (todos os disparos)
const CAP_DIA = 1000;                  // max 1000 envios nas ultimas 24h
const LOTE_MAX = 80;                   // max por execucao do cron
const JANELA_HORA_INICIO = 8;          // 8h America/Sao_Paulo
const JANELA_HORA_FIM = 21;            // 21h America/Sao_Paulo

function dentroDaJanela(): boolean {
  // Hora atual em America/Sao_Paulo
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    hour12: false,
  });
  const hora = parseInt(fmt.format(new Date()), 10);
  return hora >= JANELA_HORA_INICIO && hora < JANELA_HORA_FIM;
}

function autorizado(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${expected}`;
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

  // 1. Toggle on/off
  const { data: cfg } = await supabase
    .from("app_config")
    .select("valor")
    .eq("chave", "auto_incentivo_empate")
    .maybeSingle();
  const ligado = (cfg?.valor ?? "on") === "on";
  if (!ligado) {
    return NextResponse.json({ ok: true, skip: "desligado" });
  }

  // 2. Janela horaria
  if (!dentroDaJanela()) {
    return NextResponse.json({ ok: true, skip: "fora_janela" });
  }

  // 3. Cap global por hora e por dia (somando manuais + auto)
  const umaHoraAtras = new Date(Date.now() - 60 * 60_000).toISOString();
  const umDiaAtras = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const [{ count: enviadosHora }, { count: enviadosDia }] = await Promise.all([
    supabase
      .from("incentivo_envios_log")
      .select("*", { head: true, count: "exact" })
      .gte("criado_em", umaHoraAtras),
    supabase
      .from("incentivo_envios_log")
      .select("*", { head: true, count: "exact" })
      .gte("criado_em", umDiaAtras),
  ]);
  const restanteHora = Math.max(0, CAP_HORA - (enviadosHora ?? 0));
  const restanteDia = Math.max(0, CAP_DIA - (enviadosDia ?? 0));
  const cota = Math.min(restanteHora, restanteDia, LOTE_MAX);

  if (cota <= 0) {
    return NextResponse.json({
      ok: true,
      skip: "cap_atingido",
      enviadosHora,
      enviadosDia,
    });
  }

  // 4. Busca elegives empate (ambos os lados, cooldown de 2 dias)
  const [
    { data: elegiveis, error: erroRpc },
    { count: totalVotos },
    { data: edicao },
  ] = await Promise.all([
    supabase.rpc("incentivo_elegives_empate", {
      p_cooldown_horas: COOLDOWN_HORAS,
      p_min_minutos_apos_voto: 30,
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

  if (erroRpc) {
    return NextResponse.json(
      { error: `RPC falhou: ${erroRpc.message}` },
      { status: 500 }
    );
  }

  const lista = (elegiveis ?? []) as Elegivel[];
  // Dedup por votante (1 msg por pessoa)
  const porVotante = new Map<string, Elegivel>();
  for (const e of lista) {
    if (!porVotante.has(e.votante_id)) porVotante.set(e.votante_id, e);
  }
  const alvos = Array.from(porVotante.values()).slice(0, cota);

  if (alvos.length === 0) {
    return NextResponse.json({ ok: true, alvos: 0, motivo: "sem_empates" });
  }

  // 5. Decide canal
  const usarMeta = metaConfigurada();
  let usarZapi = false;
  let usarSms = false;
  if (!usarMeta) {
    const status = await verificarStatus();
    usarZapi = status.conectado;
    if (!usarZapi) usarSms = zenviaConfigurada();
  }
  if (!usarMeta && !usarZapi && !usarSms) {
    return NextResponse.json(
      { error: "Nenhum canal disponivel" },
      { status: 503 }
    );
  }
  const canal = usarMeta ? "meta" : usarZapi ? "zapi" : "sms";

  const votosFmt = formatVotosMil(totalVotos ?? 0);
  const diasFmt = formatDias(calcularDias(edicao?.inicio_votacao));

  let enviados = 0;
  const falhas: { votante_id: string; motivo: string }[] = [];

  for (const e of alvos) {
    let r;
    if (canal === "meta") {
      // Cron so dispara em empate puro — usa template de empate (6 vars)
      r = await enviarTemplate(
        e.whatsapp,
        META_TEMPLATE_INCENTIVO_EMPATE,
        META_TEMPLATE_LANG,
        [
          primeiroNomeDe(e.votante_nome),
          e.candidato_perdendo_nome,
          e.subcategoria_nome,
          e.candidato_lider_nome,
          votosFmt,
          diasFmt,
        ]
      );
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
          motivo: "auto_empate",
          canal,
        }),
      ]);
    } else {
      falhas.push({ votante_id: e.votante_id, motivo: r.detalhe ?? "erro" });
    }
    // pacing 2-5s
    await new Promise((res) => setTimeout(res, 2000 + Math.floor(Math.random() * 3001)));
  }

  return NextResponse.json({
    ok: true,
    alvos: alvos.length,
    enviados,
    falhas: falhas.length,
    canal,
    cap: { hora: enviadosHora, dia: enviadosDia, cota },
  });
}
