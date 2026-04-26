import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { enviarMensagemTexto } from "@/lib/zapi/client";

// Pacing 2-5s significa ~50 envios em ~5min (limite do Vercel Pro).
export const maxDuration = 300;
const LOTE_MAX = 50;

const Body = z.object({
  threshold: z.number().int().min(0).max(100).default(5),
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

function montarMensagem(e: Elegivel): string {
  const primeiroNome = (e.votante_nome.split(" ")[0] ?? "").trim() || "amigo(a)";
  const empate = e.diferenca === 0;
  const diff = e.diferenca === 1 ? "1 voto" : `${e.diferenca} votos`;
  const linhaDisputa = empate
    ? `A disputa está empatada com ${e.candidato_lider_nome}.`
    : `${e.candidato_lider_nome} está na frente por só ${diff}.`;

  return [
    `🏆 Oi, ${primeiroNome}!`,
    "",
    `Os Melhores do Ano CDL Aracaju 2025 já passaram de 5 mil votos em apenas 3 horas — obrigado pela sua participação!`,
    "",
    `Você votou em ${e.candidato_perdendo_nome} para Melhor ${e.subcategoria_nome}. ${linhaDisputa}`,
    "",
    `Compartilhe o link com seus contatos e ajude quem você votou:`,
    `🌐 https://votar.cdlaju.com.br`,
    "",
    `Cada voto faz diferença!`,
  ].join("\n");
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
  const { data: elegiveis, error } = await supabase.rpc("incentivo_elegives", {
    p_threshold: parsed.data.threshold,
  });
  if (error) {
    return NextResponse.json(
      { error: `Falha ao buscar elegíveis: ${error.message}` },
      { status: 500 }
    );
  }

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

  let enviados = 0;
  const falhas: { votante_id: string; nome: string; motivo: string }[] = [];

  for (const e of finalAlvos) {
    const mensagem = montarMensagem(e);
    const r = await enviarMensagemTexto(e.whatsapp, mensagem);
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
  });
}
