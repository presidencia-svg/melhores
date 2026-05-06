import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hashSenha } from "@/lib/admin/password";
import { verifyTurnstile } from "@/lib/turnstile";
import { getClientIp } from "@/lib/utils";
import { provisionarDominio } from "@/lib/operacional/dns";
import { enviarEmailBoasVindas } from "@/lib/operacional/email";

// Slugs reservados (rotas existentes ou conflitos previsiveis).
const SLUG_RESERVADOS = new Set([
  "admin",
  "api",
  "app",
  "www",
  "dashboard",
  "static",
  "public",
  "votar",
  "kit",
  "termos",
  "privacidade",
  "regulamento",
  "cadastrar",
  "login",
  "signup",
  "support",
  "suporte",
  "ajuda",
  "help",
  "blog",
]);

// Validacao de CNPJ basica (formato 14 digitos, com ou sem mascara).
// Nao valida digito verificador — DV pode ser checado em producao via
// Receita Federal ou lib (cpf-cnpj-validator). Por ora so formato.
function cnpjLimpo(input: string): string {
  return input.replace(/\D/g, "");
}

function cnpjFormatoValido(cnpj: string): boolean {
  return /^\d{14}$/.test(cnpj) && !/^(\d)\1+$/.test(cnpj);
}

const Body = z.object({
  nome: z.string().trim().min(3).max(80),
  cnpj: z.string().trim(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, {
      message: "Slug: 3-30 chars, letras/numeros/hifen, sem comecar/terminar com hifen",
    }),
  admin_email: z.string().trim().toLowerCase().email().max(120),
  senha: z.string().min(8).max(128),
  termos: z.literal(true),
  turnstile: z.string().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const ip = getClientIp(req.headers);

  // Anti-bot
  const turnstile = await verifyTurnstile(parsed.data.turnstile, ip);
  if (!turnstile.ok) {
    return NextResponse.json(
      { error: "Verificação anti-bot falhou. Recarregue a página." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();

  // Rate limit por IP: 3 cadastros em 1h (e' rate-limit politico, evita abuso).
  const umaHoraAtras = new Date(Date.now() - 60 * 60_000).toISOString();
  const { count } = await supabase
    .from("rate_limit_ip")
    .select("*", { head: true, count: "exact" })
    .eq("ip", ip)
    .eq("acao", "cadastro_tenant")
    .gte("criado_em", umaHoraAtras);
  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde 1 hora." },
      { status: 429 }
    );
  }

  // CNPJ
  const cnpj = cnpjLimpo(parsed.data.cnpj);
  if (!cnpjFormatoValido(cnpj)) {
    return NextResponse.json(
      { error: "CNPJ inválido — informe os 14 dígitos" },
      { status: 400 }
    );
  }

  // Slug nao pode ser reservado nem ja em uso.
  if (SLUG_RESERVADOS.has(parsed.data.slug)) {
    return NextResponse.json(
      { error: "Esse identificador é reservado, escolha outro" },
      { status: 400 }
    );
  }

  const { data: existente } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();
  if (existente) {
    return NextResponse.json(
      { error: "Esse identificador já está em uso" },
      { status: 409 }
    );
  }

  // CNPJ duplicado tambem e' bloqueado (1 CNPJ = 1 tenant).
  const { data: cnpjEmUso } = await supabase
    .from("tenants")
    .select("id")
    .eq("cnpj", cnpj)
    .maybeSingle();
  if (cnpjEmUso) {
    return NextResponse.json(
      { error: "Já existe um cadastro para esse CNPJ" },
      { status: 409 }
    );
  }

  const senhaHash = await hashSenha(parsed.data.senha);

  const trialDias = 14;
  const trialAte = new Date(Date.now() + trialDias * 86_400_000).toISOString();

  // Dominio default = "{slug}.melhoresdoano.app" — dominio da plataforma SaaS.
  // CDL Aracaju (tenant #1) mantem votar.cdlaju.com.br via seed antigo;
  // novos tenants entram em melhoresdoano.app pra DNS automatizado.
  const dominioDefault = `${parsed.data.slug}.melhoresdoano.app`;

  const { data: tenant, error: tenantErr } = await supabase
    .from("tenants")
    .insert({
      slug: parsed.data.slug,
      nome: parsed.data.nome,
      cnpj,
      dominio: dominioDefault,
      ativo: true,
      admin_password_hash: senhaHash,
      admin_email: parsed.data.admin_email,
      meta_template_lang: "pt_BR",
      trial_ate: trialAte,
      criada_via: "signup",
    })
    .select("id, slug, nome, dominio")
    .single();

  if (tenantErr || !tenant) {
    console.error("[cadastrar] insert tenant falhou:", tenantErr);
    return NextResponse.json(
      { error: "Não foi possível criar o cadastro. Tente de novo em instantes." },
      { status: 500 }
    );
  }

  // Seed de app_config padrao (mesmos toggles que o CDL Aracaju usa).
  await supabase.from("app_config").insert([
    { tenant_id: tenant.id, chave: "auto_incentivo_empate", valor: "off" },
    { tenant_id: tenant.id, chave: "spc_consulta", valor: "obrigatorio" },
    { tenant_id: tenant.id, chave: "whatsapp_validacao", valor: "ligada" },
    { tenant_id: tenant.id, chave: "auto_parcial", valor: "off" },
  ]);

  await supabase.from("rate_limit_ip").insert({ ip, acao: "cadastro_tenant" });

  // Operacional: provisionamento de DNS + email de boas-vindas em paralelo.
  // Ambos sao gracious-fail (logam erro mas nao quebram signup) — tenant
  // ja existe e pode ser corrigido manualmente se algo aqui falhar.
  const [dnsRes, emailRes] = await Promise.allSettled([
    tenant.dominio
      ? provisionarDominio(tenant.dominio)
      : Promise.resolve({ skipped: true as const, motivo: "sem dominio" }),
    enviarEmailBoasVindas(parsed.data.admin_email, {
      nome: tenant.nome,
      slug: tenant.slug,
      dominio: tenant.dominio,
    }),
  ]);

  // Logs uteis em prod: ambos sao opcionais mas se falharem queremos saber.
  if (dnsRes.status === "rejected") {
    console.error("[cadastrar] dns provisionamento crashou:", dnsRes.reason);
  } else if ("ok" in dnsRes.value && dnsRes.value.ok === false) {
    console.error(
      `[cadastrar] dns ${dnsRes.value.etapa}: ${dnsRes.value.detalhe}`
    );
  } else if ("skipped" in dnsRes.value && dnsRes.value.skipped) {
    console.warn("[cadastrar] dns pulado:", dnsRes.value.motivo);
  }
  if (emailRes.status === "rejected") {
    console.error("[cadastrar] email crashou:", emailRes.reason);
  } else if ("ok" in emailRes.value && emailRes.value.ok === false) {
    console.error("[cadastrar] email falhou:", emailRes.value.detalhe);
  } else if ("skipped" in emailRes.value && emailRes.value.skipped) {
    console.warn("[cadastrar] email pulado:", emailRes.value.motivo);
  }

  // Front usa esses flags pra ajustar a copy do /cadastrar/sucesso.
  const dnsAuto =
    dnsRes.status === "fulfilled" &&
    "ok" in dnsRes.value &&
    dnsRes.value.ok === true;
  const emailEnviado =
    emailRes.status === "fulfilled" &&
    "ok" in emailRes.value &&
    emailRes.value.ok === true;

  return NextResponse.json({
    ok: true,
    tenant: {
      slug: tenant.slug,
      nome: tenant.nome,
      dominio: tenant.dominio,
    },
    operacional: {
      dnsAuto,
      emailEnviado,
    },
  });
}
