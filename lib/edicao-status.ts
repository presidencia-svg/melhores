import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type Edicao = {
  id: string;
  ano: number;
  nome: string;
  inicio_votacao: string;
  fim_votacao: string;
  divulgacao_resultado: string | null;
  ativa: boolean;
};

export type EdicaoStatus =
  | { status: "aberta"; edicao: Edicao }
  | { status: "nao_iniciada"; edicao: Edicao }
  | { status: "encerrada"; edicao: Edicao }
  | { status: "sem_edicao" };

// Status da edicao atual (votacao aberta? encerrada? nao iniciada?).
// Usado pelo layout de /votar e pelas APIs de gravacao pra bloquear voto
// fora da janela.
export async function getEdicaoStatus(): Promise<EdicaoStatus> {
  const supabase = createSupabaseAdminClient();
  const { data: edicao } = await supabase
    .from("edicao")
    .select(
      "id, ano, nome, inicio_votacao, fim_votacao, divulgacao_resultado, ativa"
    )
    .eq("ativa", true)
    .order("ano", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!edicao) return { status: "sem_edicao" };

  const agora = Date.now();
  if (agora < new Date(edicao.inicio_votacao).getTime()) {
    return { status: "nao_iniciada", edicao };
  }
  if (agora > new Date(edicao.fim_votacao).getTime()) {
    return { status: "encerrada", edicao };
  }
  return { status: "aberta", edicao };
}
