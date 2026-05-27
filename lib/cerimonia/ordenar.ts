// Ordena slides da cerimonia por categoria → subcategoria → empresa.
// Slides sem categoria vao pro final (ordem alfabetica entre si).
// Usado tanto no /play (sequencia do LED) quanto no /admin (gerenciamento)
// pra dar visao unica e consistente.

export type SlideOrdenavel = {
  empresa: string;
  categoria: string | null;
  subcategoria: string | null;
};

export function ordenarPorCategoria<T extends SlideOrdenavel>(slides: T[]): T[] {
  return [...slides].sort((a, b) => {
    const ca = (a.categoria ?? "zzz").toLowerCase();
    const cb = (b.categoria ?? "zzz").toLowerCase();
    if (ca !== cb) return ca.localeCompare(cb, "pt-BR");
    const sa = (a.subcategoria ?? "").toLowerCase();
    const sb = (b.subcategoria ?? "").toLowerCase();
    if (sa !== sb) return sa.localeCompare(sb, "pt-BR");
    return a.empresa.localeCompare(b.empresa, "pt-BR");
  });
}
