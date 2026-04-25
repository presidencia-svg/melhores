import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const COOKIE_NAME = "mda_session";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

export type VotanteSessao = {
  id: string;
  cpf: string;
  nome: string;
  selfie_url: string | null;
  whatsapp: string | null;
  whatsapp_validado: boolean;
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
