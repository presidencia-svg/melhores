import { NextResponse } from "next/server";
import { z } from "zod";
import { hashCpf, isValidCpf, onlyDigits } from "@/lib/cpf";
import { consultarCpfSpc } from "@/lib/spc/client";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  clearPreCadastro,
  clearPreRetorno,
  clearVotanteSessao,
  setPreCadastro,
  setPreRetorno,
  setVotanteSessao,
} from "@/lib/sessao";
import { getClientIp, mascararWhatsapp } from "@/lib/utils";
import { verifyTurnstile } from "@/lib/turnstile";

const Body = z.object({
  cpf: z.string(),
  nome: z.string().min(2).max(120).optional(),
  fingerprint: z.string().nullable().optional(),
  turnstileToken: z.string().nullable().optional(),
});

const MAX_CPFS_POR_DISPOSITIVO = 2;

function deveConsultarSPC(): boolean {
  const rate = parseFloat(process.env.SPC_SAMPLE_RATE ?? "0");
  if (isNaN(rate) || rate <= 0) return false;
  if (rate >= 1) return true;
  return Math.random() < rate;
}

function normalizarNome(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export async function POST(req: Request) {
  try {
    return await handleIdentificar(req);
  } catch (err) {
    console.error("[identificar] uncaught:", err);
    const detalhe = err instanceof Error ? err.message : "erro desconhecido";
    return NextResponse.json(
      { error: `Falha interna: ${detalhe}` },
      { status: 500 }
    );
  }
}

async function handleIdentificar(req: Request) {
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

  // Cloudflare Turnstile (se TURNSTILE_SECRET_KEY configurado)
  const turnstileResult = await verifyTurnstile(parsed.data.turnstileToken, ip);
  if (!turnstileResult.ok) {
    const codes = turnstileResult.errorCodes.join(",");
    let userMessage = "Falha na verificação anti-robô. Recarregue a página e tente novamente.";
    if (codes.includes("invalid-input-secret")) {
      userMessage = "Erro de configuração do anti-robô. Avisamos a equipe.";
    } else if (codes.includes("timeout-or-duplicate")) {
      userMessage = "Token expirou. Recarregue a página e tente novamente.";
    } else if (codes.includes("missing-input-response")) {
      userMessage = "Aguarde a verificação anti-robô antes de continuar.";
    }
    return NextResponse.json(
      { error: userMessage, debug: codes },
      { status: 403 }
    );
  }

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

  // Ja votou nessa edicao? Se sim, abre fluxo de retorno (votar nas
  // subcategorias que ainda faltam, OTP no celular cadastrado).
  const { data: existente } = await supabase
    .from("votantes")
    .select("id, whatsapp, whatsapp_validado, selfie_url")
    .eq("edicao_id", edicao.id)
    .eq("cpf_hash", cpfHash)
    .maybeSingle();

  if (existente) {
    // Cadastro incompleto (sem whatsapp validado). Em vez de bloquear, deixa
    // o votante completar agora: abre a sessao dele e o frontend manda pra
    // tela de confirmacao do WhatsApp.
    if (!existente.whatsapp_validado || !existente.whatsapp) {
      await clearPreCadastro();
      await clearPreRetorno();
      await setVotanteSessao(existente.id);
      return NextResponse.json({ ok: true, completarCadastro: true });
    }
    // Abre fluxo de retorno: cookie pre-retorno (so id), limpa qualquer
    // sessao/pre-cadastro de fluxos antigos pra nao confundir.
    await clearVotanteSessao();
    await clearPreCadastro();
    await setPreRetorno(existente.id);
    return NextResponse.json({
      ok: true,
      retorno: true,
      whatsapp_masked: mascararWhatsapp(existente.whatsapp),
    });
  }

  // Limite por dispositivo (máx 2 CPFs por fingerprint)
  const fingerprint = parsed.data.fingerprint ?? null;
  if (fingerprint) {
    const { count: usados } = await supabase
      .from("votantes")
      .select("*", { head: true, count: "exact" })
      .eq("edicao_id", edicao.id)
      .eq("device_fingerprint", fingerprint);

    if ((usados ?? 0) >= MAX_CPFS_POR_DISPOSITIVO) {
      return NextResponse.json(
        {
          error: `Limite de ${MAX_CPFS_POR_DISPOSITIVO} votantes por dispositivo atingido. Use outro celular ou computador.`,
        },
        { status: 429 }
      );
    }
  }

  const nomeAutodeclarado = parsed.data.nome?.trim() ?? "";

  // Decide se este votante entra no sample SPC (auditoria)
  const consultarSpc = deveConsultarSPC();
  let nomeFinal: string | null = null;
  let spcValidado = false;
  let source: "spc" | "autodeclarado" = "autodeclarado";

  if (consultarSpc) {
    const lookup = await consultarCpfSpc(cpf);
    if (lookup.ok) {
      nomeFinal = lookup.nome;
      spcValidado = true;
      source = "spc";
      // Se o usuario tambem digitou nome, registra divergencia mas nao bloqueia
      if (nomeAutodeclarado) {
        const a = normalizarNome(lookup.nome);
        const b = normalizarNome(nomeAutodeclarado);
        const primeiroNomeA = a.split(" ")[0] ?? "";
        const primeiroNomeB = b.split(" ")[0] ?? "";
        if (primeiroNomeA && primeiroNomeB && primeiroNomeA !== primeiroNomeB) {
          console.warn("[identificar] SPC mismatch:", {
            autodeclarado: nomeAutodeclarado,
            spc: lookup.nome,
          });
        }
      }
    } else {
      console.warn("[identificar] SPC falhou no sample:", lookup.motivo);
    }
  }

  // Se nao foi pra SPC e nao temos nome autodeclarado, pede o nome ao usuario.
  // Nao persiste pre-cadastro — frontend faz nova chamada com cpf + nome.
  if (!nomeFinal && !nomeAutodeclarado) {
    return NextResponse.json({ ok: true, needName: true });
  }

  // Caso contrario, persiste o pre-cadastro com o melhor nome disponivel
  // (SPC > autodeclarado).
  const nomePreCadastro = nomeFinal ?? nomeAutodeclarado;
  void userAgent; // ip/userAgent são lidos novamente no momento da selfie
  await setPreCadastro({
    edicao_id: edicao.id,
    cpf,
    cpf_hash: cpfHash,
    nome: nomePreCadastro,
    nome_autodeclarado: nomeAutodeclarado || nomePreCadastro,
    spc_validado: spcValidado,
    fingerprint,
  });

  return NextResponse.json({ ok: true, nome: nomePreCadastro, source });
}
