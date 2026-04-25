import { NextResponse } from "next/server";
import { z } from "zod";
import { hashCpf, isValidCpf, onlyDigits } from "@/lib/cpf";
import { consultarCpfSpc } from "@/lib/spc/client";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { setVotanteSessao } from "@/lib/sessao";
import { getClientIp } from "@/lib/utils";

const Body = z.object({ cpf: z.string() });

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const cpf = onlyDigits(parsed.data.cpf);
  if (!isValidCpf(cpf)) {
    return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const ip = getClientIp(req.headers);
  const userAgent = req.headers.get("user-agent") ?? "";

  // Limita 5 tentativas por IP nas últimas 5min
  const cincoMin = new Date(Date.now() - 5 * 60_000).toISOString();
  const { count } = await supabase
    .from("rate_limit_ip")
    .select("*", { head: true, count: "exact" })
    .eq("ip", ip)
    .eq("acao", "identificar")
    .gte("criado_em", cincoMin);

  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429 }
    );
  }

  await supabase.from("rate_limit_ip").insert({ ip, acao: "identificar" });

  // Edição ativa
  const { data: edicao } = await supabase
    .from("edicao")
    .select("id, fim_votacao, inicio_votacao")
    .eq("ativa", true)
    .order("ano", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!edicao) {
    return NextResponse.json({ error: "Nenhuma edição ativa" }, { status: 503 });
  }

  const agora = new Date();
  if (agora < new Date(edicao.inicio_votacao)) {
    return NextResponse.json({ error: "A votação ainda não começou" }, { status: 403 });
  }
  if (agora > new Date(edicao.fim_votacao)) {
    return NextResponse.json({ error: "A votação foi encerrada" }, { status: 403 });
  }

  const cpfHash = hashCpf(cpf);

  // Já votou nessa edição?
  const { data: existente } = await supabase
    .from("votantes")
    .select("id, selfie_url")
    .eq("edicao_id", edicao.id)
    .eq("cpf_hash", cpfHash)
    .maybeSingle();

  if (existente) {
    return NextResponse.json(
      { error: "Este CPF já participou da votação." },
      { status: 409 }
    );
  }

  // Consulta SPC
  const lookup = await consultarCpfSpc(cpf);
  if (!lookup.ok) {
    const map = {
      nao_encontrado: "CPF não localizado. Verifique e tente novamente.",
      erro_externo: "Serviço temporariamente indisponível. Tente em instantes.",
      credenciais: "Erro interno do sistema. Avisamos a equipe.",
      rate_limit: "Estamos com muito acesso. Tente novamente em alguns minutos.",
    } as const;
    const userMessage = map[lookup.motivo];
    // Em dev, expõe detalhe pra debug; em prod só a mensagem amigável
    const debugDetail = process.env.NODE_ENV !== "production" && lookup.detalhe
      ? ` [debug: ${lookup.detalhe}]`
      : "";
    return NextResponse.json({ error: userMessage + debugDetail }, { status: 502 });
  }

  // Cria votante (sem selfie ainda)
  const { data: votante, error: insertErr } = await supabase
    .from("votantes")
    .insert({
      edicao_id: edicao.id,
      cpf_hash: cpfHash,
      cpf,
      nome: lookup.nome,
      ip,
      user_agent: userAgent,
    })
    .select("id")
    .single();

  if (insertErr || !votante) {
    return NextResponse.json({ error: "Falha ao registrar identificação" }, { status: 500 });
  }

  await setVotanteSessao(votante.id);

  return NextResponse.json({ ok: true, nome: lookup.nome });
}
