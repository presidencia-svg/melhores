// Tipos + helpers puros client-safe. Sem import de @/lib/supabase/server
// pra evitar quebra de build quando importado de "use client" components.

export type NivelPatrocinio = "patrocinio" | "apoio";

export type Patrocinador = {
  id: string;
  nome: string;
  logo_url: string;
  link: string | null;
  nivel: NivelPatrocinio;
  ordem: number;
};

export const ORDEM_NIVEIS: NivelPatrocinio[] = ["patrocinio", "apoio"];

export const LABEL_NIVEIS: Record<NivelPatrocinio, string> = {
  patrocinio: "Patrocínio",
  apoio: "Apoio",
};

// Cotas: quantos podem existir simultaneamente por edicao.
// patrocinio: 1 cota (forcado por unique partial no banco)
// apoio:      4 cotas (validado na API antes do INSERT)
export const COTAS: Record<NivelPatrocinio, number> = {
  patrocinio: 1,
  apoio: 4,
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
