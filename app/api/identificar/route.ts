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
  privateMode: z.boolean().optional(),
  turnstileToken: z.string().nullable().optional(),
});

const MAX_CPFS_POR_DISPOSITIVO = 2;

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

  if (parsed.data.privateMode) {
    return NextResponse.json(
      {
        error:
          "Não é possível votar em janela anônima/privada. Abra uma janela normal do navegador e tente de novo.",
      },
      { status: 403 }
    );
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

  // SPC obrigatorio pra todo novo cadastro: bloqueia CPFs gerados por
  // sites de fake. Erro tecnico do SPC tambem bloqueia (sem fail-open).
  const lookup = await consultarCpfSpc(cpf);

  if (!lookup.ok) {
    if (lookup.motivo === "nao_encontrado") {
      return NextResponse.json(
        {
          error:
            "CPF não localizado na base oficial do SPC. Confira os números e tente novamente.",
        },
        { status: 403 }
      );
    }
    console.error("[identificar] SPC erro tecnico:", lookup.motivo, lookup.detalhe);
    return NextResponse.json(
      {
        error:
          "Verificação no SPC indisponível no momento. Tente novamente em alguns minutos.",
      },
      { status: 503 }
    );
  }

  const nomeFinal = lookup.nome;
  void userAgent; // ip/userAgent são lidos novamente no momento da selfie
  await setPreCadastro({
    edicao_id: edicao.id,
    cpf,
    cpf_hash: cpfHash,
    nome: nomeFinal,
    nome_autodeclarado: nomeFinal,
    spc_validado: true,
    fingerprint,
  });

  return NextResponse.json({ ok: true, nome: nomeFinal, source: "spc" });
}
