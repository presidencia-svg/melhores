import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type NivelPatrocinio = "master" | "ouro" | "prata" | "bronze" | "apoio";

export type Patrocinador = {
  id: string;
  nome: string;
  logo_url: string;
  link: string | null;
  nivel: NivelPatrocinio;
  ordem: number;
};

export const ORDEM_NIVEIS: NivelPatrocinio[] = [
  "master",
  "ouro",
  "prata",
  "bronze",
  "apoio",
];

export const LABEL_NIVEIS: Record<NivelPatrocinio, string> = {
  master: "Master",
  ouro: "Ouro",
  prata: "Prata",
  bronze: "Bronze",
  apoio: "Apoio",
};

// Busca patrocinadores ativos da edicao, ja' ordenados (master primeiro,
// depois ouro, etc, com desempate por ordem e nome).
export async function listarPatrocinadores(
  edicaoId: string
): Promise<Patrocinador[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("patrocinadores")
    .select("id, nome, logo_url, link, nivel, ordem")
    .eq("edicao_id", edicaoId)
    .eq("ativo", true);
  const lista = (data ?? []) as Patrocinador[];
  return lista.sort((a, b) => {
    const niA = ORDEM_NIVEIS.indexOf(a.nivel);
    const niB = ORDEM_NIVEIS.indexOf(b.nivel);
    if (niA !== niB) return niA - niB;
    if (a.ordem !== b.ordem) return a.ordem - b.ordem;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
}

// Agrupa por nivel — util pra renderizar secoes separadas com tamanhos diferentes.
export function agruparPorNivel(
  lista: Patrocinador[]
): Array<{ nivel: NivelPatrocinio; itens: Patrocinador[] }> {
  const mapa = new Map<NivelPatrocinio, Patrocinador[]>();
  for (const p of lista) {
    if (!mapa.has(p.nivel)) mapa.set(p.nivel, []);
    mapa.get(p.nivel)!.push(p);
  }
  return ORDEM_NIVEIS.filter((n) => mapa.has(n)).map((nivel) => ({
    nivel,
    itens: mapa.get(nivel)!,
  }));
}
