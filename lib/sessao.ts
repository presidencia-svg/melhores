import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const COOKIE_NAME = "mda_session";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h
const PRE_COOKIE = "mda_pre";
const PRE_MAX_AGE = 60 * 30; // 30min — só pra concluir o fluxo da selfie
const RETORNO_COOKIE = "mda_retorno";
const RETORNO_MAX_AGE = 60 * 30; // 30min — só pra concluir o OTP de retorno

export type VotanteSessao = {
  id: string;
  cpf: string;
  nome: string;
  selfie_url: string | null;
  whatsapp: string | null;
  whatsapp_validado: boolean;
};

// Dados coletados em /api/identificar e mantidos em cookie httpOnly até a
// selfie ser validada. Só aí o votante é gravado em `votantes`.
export type PreCadastro = {
  edicao_id: string;
  cpf: string;
  cpf_hash: string;
  nome: string;
  nome_autodeclarado: string;
  spc_validado: boolean;
  fingerprint: string | null;
};

export async function setVotanteSessao(votanteId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, votanteId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearVotanteSessao(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function setPreCadastro(data: PreCadastro): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PRE_COOKIE, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PRE_MAX_AGE,
  });
}

export async function getPreCadastro(): Promise<PreCadastro | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PRE_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PreCadastro;
  } catch {
    return null;
  }
}

export async function clearPreCadastro(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PRE_COOKIE);
}

// "Pre-retorno": votante ja existe e quer voltar pra votar nas subcats que
// nao votou. Cookie curto guarda so o id ate o OTP ser validado e a sessao
// completa ser criada.
export async function setPreRetorno(votanteId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(RETORNO_COOKIE, votanteId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: RETORNO_MAX_AGE,
  });
}

export async function getPreRetorno(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(RETORNO_COOKIE)?.value ?? null;
}

export async function clearPreRetorno(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(RETORNO_COOKIE);
}

export async function getVotanteSessao(): Promise<VotanteSessao | null> {
  const cookieStore = await cookies();
  const id = cookieStore.get(COOKIE_NAME)?.value;
  if (!id) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("votantes")
    .select("id, cpf, nome, selfie_url, whatsapp, whatsapp_validado")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as VotanteSessao;
}
