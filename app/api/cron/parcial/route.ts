import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { enviarMensagemTexto, verificarStatus } from "@/lib/zapi/client";
import { enviarSmsZenvia, zenviaConfigurada } from "@/lib/sms/zenvia";
import { enviarTemplate, metaConfigurada } from "@/lib/meta-whatsapp/client";

export const maxDuration = 300;

const META_TEMPLATE_PARCIAL =
  process.env.META_TEMPLATE_PARCIAL ?? "parcial_voto_2025";
const META_TEMPLATE_LANG = process.env.META_TEMPLATE_LANG ?? "pt_BR";

// Limites do disparo automatico
const CAP_HORA = 200;                   // max 200 envios/h (todos os disparos somados)
const CAP_DIA_DEFAULT = 1200;           // valor padrao quando admin nao configurou
const LOTE_MAX = 80;                    // max por execucao do cron (~5min com pacing)
const JANELA_HORA_INICIO = 8;           // 8h America/Maceio
const JANELA_HORA_FIM = 21;             // 21h
const MIN_MINUTOS_APOS_VOTO = 30;       // espera 30min depois do ultimo voto (era 60)
const MAX_DIFF_PCT = 100;               // sem filtro de diff — manda pra todos elegives (era 30)

type ElegivelParcial = {
  votante_id: string;
  votante_nome: string;
  whatsapp: string;
  ultimo_voto_em: string;
  melhor_diff_pct: number;
};

type LinhaRpc = {
  subcategoria_id: string;
  subcategoria_nome: string;
  categoria_nome: string;
  pos: number;
  candidato_nome: string;
  votos: number;
  pct: number;
  total_subcat: number;
  diff_top12: number;
};

function dentroDaJanela(): boolean {
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Maceio",
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

function primeiroNomeDe(nome: string): string {
  const primeiro = (nome.split(" ")[0] ?? "").trim();
  return primeiro || "amigo(a)";
}

// Mensagem completa pra Z-API (texto livre).
function montarMensagemCompleta(votanteNome: string, linhas: LinhaRpc[]): string | null {
  if (linhas.length === 0) return null;
  const porSub = new Map<string, LinhaRpc[]>();
  const ordemSubs: string[] = [];
  for (const l of linhas) {
    if (!porSub.has(l.subcategoria_id)) {
      porSub.set(l.subcategoria_id, []);
      ordemSubs.push(l.subcategoria_id);
    }
    porSub.get(l.subcategoria_id)!.push(l);
  }
  const blocos: string[] = [];
  for (const subId of ordemSubs) {
    const grupo = (porSub.get(subId) ?? []).slice().sort((a, b) => a.pos - b.pos);
    if (grupo.length === 0) continue;
    const sub = grupo[0]!;
    const texto = grupo.map((c) => `${c.pos}º ${c.candidato_nome} — ${c.pct}%`).join("\n");
    blocos.push(`📍 Melhor ${sub.subcategoria_nome}\n${texto}`);
  }
  if (blocos.length === 0) return null;
  return [
    `🏆 Parcial dos Melhores do Ano CDL Aracaju 2025`,
    "",
    `Olá, ${primeiroNomeDe(votanteNome)}! Veja como estão as ${blocos.length === 1 ? "categoria" : "categorias"} mais acirradas em que você votou:`,
    "",
    blocos.join("\n\n"),
    "",
    `Compartilhe e ajude quem você votou:`,
    `🌐 votar.cdlaju.com.br`,
  ].join("\n");
}

// SMS curtinho — primeira sub com top 1 vs top 2.
function montarSms(votanteNome: string, linhas: LinhaRpc[]): string | null {
  if (linhas.length === 0) return null;
  const primeiraSub = linhas[0]!;
  const top = linhas
    .filter((l) => l.subcategoria_id === primeiraSub.subcategoria_id)
    .sort((a, b) => a.pos - b.pos)
    .slice(0, 2);
  if (top.length === 0) return null;
  const trecho = top.map((c) => `${c.pos}o ${c.candidato_nome} ${c.pct}%`).join(" x ");
  return `Ola ${primeiroNomeDe(votanteNome)}! ${primeiraSub.subcategoria_nome}: ${trecho}. Compartilhe: votar.cdlaju.com.br`;
}

export async function GET(req: Request) { return handle(req); }
export async function POST(req: Request) { return handle(req); }

async function handle(req: Request) {
  if (!autorizado(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  // 1. Toggle on/off + cap diario configuravel pelo admin
  const { data: cfgs } = await supabase
    .from("app_config")
    .select("chave, valor")
    .in("chave", ["auto_parcial", "auto_parcial_cap_dia"]);
  const cfgMap = new Map((cfgs ?? []).map((c) => [c.chave, c.valor]));
  const ligado = (cfgMap.get("auto_parcial") ?? "off") === "on";
  if (!ligado) {
    return NextResponse.json({ ok: true, skip: "desligado" });
  }
  const capDiaRaw = cfgMap.get("auto_parcial_cap_dia");
  const capDiaParsed = capDiaRaw ? parseInt(capDiaRaw, 10) : CAP_DIA_DEFAULT;
  const capDia = Number.isFinite(capDiaParsed) ? capDiaParsed : CAP_DIA_DEFAULT;

  // 2. Janela horaria
  if (!dentroDaJanela()) {
    return NextResponse.json({ ok: true, skip: "fora_janela" });
  }

  // 3. Cap diario e horario — count via parcial_enviada_em (lifetime, 1 vez/pessoa)
  const umaHoraAtras = new Date(Date.now() - 60 * 60_000).toISOString();
  const umDiaAtras = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const [{ count: enviadosHora }, { count: enviadosDia }] = await Promise.all([
    supabase
      .from("votantes")
      .select("*", { head: true, count: "exact" })
      .gte("parcial_enviada_em", umaHoraAtras),
    supabase
      .from("votantes")
      .select("*", { head: true, count: "exact" })
      .gte("parcial_enviada_em", umDiaAtras),
  ]);
  const restanteHora = Math.max(0, CAP_HORA - (enviadosHora ?? 0));
  const restanteDia = Math.max(0, capDia - (enviadosDia ?? 0));
  const cota = Math.min(restanteHora, restanteDia, LOTE_MAX);
  if (cota <= 0) {
    return NextResponse.json({
      ok: true,
      skip: "cap_atingido",
      enviadosHora,
      enviadosDia,
    });
  }

  // 4. Fila com filtros inteligentes
  const { data: elegiveisRaw, error: erroRpc } = await supabase.rpc(
    "parcial_elegives_auto",
    { p_min_minutos_apos_voto: MIN_MINUTOS_APOS_VOTO, p_max_diff_pct: MAX_DIFF_PCT }
  );
  if (erroRpc) {
    return NextResponse.json(
      { error: `RPC falhou: ${erroRpc.message}` },
      { status: 500 }
    );
  }
  const fila = ((elegiveisRaw ?? []) as ElegivelParcial[]).slice(0, cota);
  if (fila.length === 0) {
    return NextResponse.json({ ok: true, alvos: 0, motivo: "fila_vazia" });
  }

  // 5. Decide canal: Meta > Z-API > SMS
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

  let enviados = 0;
  const falhas: { votante_id: string; motivo: string }[] = [];

  for (const e of fila) {
    // Pega top 3 subs acirradas do votante
    const { data: linhas, error: rpcErr } = await supabase.rpc(
      "parcial_subcats_votante",
      { p_votante_id: e.votante_id }
    );
    if (rpcErr || !linhas || linhas.length === 0) {
      falhas.push({
        votante_id: e.votante_id,
        motivo: rpcErr?.message ?? "sem dados",
      });
      continue;
    }
    const linhasTip = linhas as LinhaRpc[];

    let r;
    if (canal === "meta") {
      // Template Meta usa 6 vars: nome, sub, top1, pct1, top2, pct2
      const primeiraSub = linhasTip[0]!;
      const top = linhasTip
        .filter((l) => l.subcategoria_id === primeiraSub.subcategoria_id)
        .sort((a, b) => a.pos - b.pos)
        .slice(0, 2);
      if (top.length < 2) {
        falhas.push({ votante_id: e.votante_id, motivo: "subcat <2 candidatos" });
        continue;
      }
      r = await enviarTemplate(
        e.whatsapp,
        META_TEMPLATE_PARCIAL,
        META_TEMPLATE_LANG,
        [
          primeiroNomeDe(e.votante_nome),
          primeiraSub.subcategoria_nome,
          top[0]!.candidato_nome,
          String(top[0]!.pct),
          top[1]!.candidato_nome,
          String(top[1]!.pct),
        ]
      );
    } else if (canal === "zapi") {
      const msg = montarMensagemCompleta(e.votante_nome, linhasTip);
      if (!msg) {
        falhas.push({ votante_id: e.votante_id, motivo: "sem mensagem" });
        continue;
      }
      r = await enviarMensagemTexto(e.whatsapp, msg);
    } else {
      const msg = montarSms(e.votante_nome, linhasTip);
      if (!msg) {
        falhas.push({ votante_id: e.votante_id, motivo: "sem mensagem" });
        continue;
      }
      r = await enviarSmsZenvia(e.whatsapp, msg);
    }

    if (r.ok) {
      enviados += 1;
      await supabase
        .from("votantes")
        .update({ parcial_enviada_em: new Date().toISOString() })
        .eq("id", e.votante_id);
    } else {
      falhas.push({ votante_id: e.votante_id, motivo: r.detalhe ?? "erro" });
    }

    // pacing 2-5s
    await new Promise((res) => setTimeout(res, 2000 + Math.floor(Math.random() * 3001)));
  }

  return NextResponse.json({
    ok: true,
    alvos: fila.length,
    enviados,
    falhas: falhas.length,
    canal,
    cap: { hora: enviadosHora, dia: enviadosDia, cota },
  });
}
