// Tipos + helpers puros client-safe. Sem import de @/lib/supabase/server
// pra evitar quebra de build quando importado de "use client" components
// (mesmo padrao do split lib/creditos/precos.ts).

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

// Agrupa por nivel — util pra renderizar secoes separadas com tamanhos
// diferentes. Funcao pura, sem I/O — pode rodar no client.
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
