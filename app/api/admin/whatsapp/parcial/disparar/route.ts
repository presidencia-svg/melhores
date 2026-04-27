import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { enviarMensagemTexto, verificarStatus } from "@/lib/zapi/client";
import { enviarSmsZenvia, zenviaConfigurada } from "@/lib/sms/zenvia";

// Pacing 2-5s significa ~50 envios em ~5min.
export const maxDuration = 300;
const LOTE_MAX = 50;

const Body = z.object({
  votante_ids: z.array(z.string().uuid()).min(1).max(LOTE_MAX),
});

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

function montarMensagem(votanteNome: string, linhas: LinhaRpc[]): string | null {
  if (linhas.length === 0) return null;

  // agrupa por subcategoria
  const porSub = new Map<string, LinhaRpc[]>();
  for (const l of linhas) {
    const key = l.subcategoria_id;
    if (!porSub.has(key)) porSub.set(key, []);
    porSub.get(key)!.push(l);
  }

  // ordena cada grupo por pos e mantém ordem das subs do RPC
  const ordemSubs: string[] = [];
  for (const l of linhas) {
    if (!ordemSubs.includes(l.subcategoria_id)) ordemSubs.push(l.subcategoria_id);
  }

  const primeiroNome = (votanteNome.split(" ")[0] ?? "").trim() || "amigo(a)";

  const blocos: string[] = [];
  for (const subId of ordemSubs) {
    const grupo = (porSub.get(subId) ?? []).slice().sort((a, b) => a.pos - b.pos);
    if (grupo.length === 0) continue;
    const sub = grupo[0]!;
    const linhasTexto = grupo
      .map((c) => `${c.pos}º ${c.candidato_nome} — ${c.pct}%`)
      .join("\n");
    blocos.push(`📍 Melhor ${sub.subcategoria_nome}\n${linhasTexto}`);
  }

  if (blocos.length === 0) return null;

  return [
    `🏆 Parcial dos Melhores do Ano CDL Aracaju 2025`,
    "",
    `Olá, ${primeiroNome}! Veja como estão as ${blocos.length === 1 ? "categoria" : "categorias"} mais acirradas em que você votou:`,
    "",
    blocos.join("\n\n"),
    "",
    `Compartilhe e ajude quem você votou:`,
    `🌐 votar.cdlaju.com.br`,
  ].join("\n");
}

// Versão SMS curta (~155 chars): pega só a subcategoria mais acirrada com top 1 e top 2.
function montarSms(votanteNome: string, linhas: LinhaRpc[]): string | null {
  if (linhas.length === 0) return null;
  const primeiroNome = (votanteNome.split(" ")[0] ?? "").trim() || "amigo";
  const primeiraSub = linhas[0]!;
  const top = linhas
    .filter((l) => l.subcategoria_id === primeiraSub.subcategoria_id)
    .sort((a, b) => a.pos - b.pos)
    .slice(0, 2);
  if (top.length === 0) return null;
  const trecho = top.map((c) => `${c.pos}o ${c.candidato_nome} ${c.pct}%`).join(" x ");
  return `Ola ${primeiroNome}! ${primeiraSub.subcategoria_nome}: ${trecho}. Compartilhe: votar.cdlaju.com.br`;
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

  // Busca dados dos votantes alvo (e revalida elegibilidade)
  const { data: votantes, error: vErr } = await supabase
    .from("votantes")
    .select("id, nome, whatsapp, whatsapp_validado, parcial_enviada_em")
    .in("id", parsed.data.votante_ids);

  if (vErr) {
    return NextResponse.json({ error: `Falha: ${vErr.message}` }, { status: 500 });
  }

  const elegiveis = (votantes ?? []).filter(
    (v) => v.whatsapp_validado && v.whatsapp && !v.parcial_enviada_em
  );

  // Decide canal: WhatsApp se Z-API conectada; senão SMS via Zenvia (se configurada).
  const status = await verificarStatus();
  const usarSms = !status.conectado && zenviaConfigurada();
  if (!status.conectado && !zenviaConfigurada()) {
    return NextResponse.json(
      {
        error:
          "Z-API desconectada e Zenvia (SMS) não configurada. Reconecte o WhatsApp ou configure ZENVIA_API_TOKEN/ZENVIA_FROM.",
      },
      { status: 503 }
    );
  }

  let enviados = 0;
  const falhas: { votante_id: string; nome: string; motivo: string }[] = [];

  for (const v of elegiveis) {
    const { data: linhas, error: rpcErr } = await supabase.rpc(
      "parcial_subcats_votante",
      { p_votante_id: v.id }
    );
    if (rpcErr) {
      falhas.push({
        votante_id: v.id,
        nome: v.nome,
        motivo: `rpc: ${rpcErr.message}`,
      });
      continue;
    }

    const linhasTip = (linhas ?? []) as LinhaRpc[];
    const mensagem = usarSms
      ? montarSms(v.nome, linhasTip)
      : montarMensagem(v.nome, linhasTip);
    if (!mensagem) {
      falhas.push({ votante_id: v.id, nome: v.nome, motivo: "sem dados de parcial" });
      continue;
    }

    const r = usarSms
      ? await enviarSmsZenvia(v.whatsapp!, mensagem)
      : await enviarMensagemTexto(v.whatsapp!, mensagem);
    if (r.ok) {
      enviados += 1;
      await supabase
        .from("votantes")
        .update({ parcial_enviada_em: new Date().toISOString() })
        .eq("id", v.id);
    } else {
      falhas.push({
        votante_id: v.id,
        nome: v.nome,
        motivo: r.detalhe ?? "erro",
      });
    }

    // pacing aleatório 2-5s
    const delayMs = 2000 + Math.floor(Math.random() * 3001);
    await new Promise((res) => setTimeout(res, delayMs));
  }

  return NextResponse.json({
    ok: true,
    total_alvo: elegiveis.length,
    enviados,
    falhas: falhas.length,
    detalhes_falhas: falhas,
    canal: usarSms ? "sms" : "whatsapp",
  });
}
