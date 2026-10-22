"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export type Colocado = { nome: string; votos: number };
export type SubcategoriaResultado = {
  id: string;
  nome: string;
  ordem: number;
  total: number;
  colocados: Colocado[];
};
export type CategoriaResultado = {
  id: string;
  nome: string;
  subcategorias: SubcategoriaResultado[];
};

const MEDALHAS = [
  { label: "1º", cls: "bg-gold-400 text-navy-900" },
  { label: "2º", cls: "bg-slate-300 text-navy-900" },
  { label: "3º", cls: "bg-amber-700 text-white" },
];

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function ResultadosLista({ categorias }: { categorias: CategoriaResultado[] }) {
  const [busca, setBusca] = useState("");
  const [catSel, setCatSel] = useState<string>("todas");

  const filtradas = useMemo(() => {
    const q = normalizar(busca.trim());
    return categorias
      .filter((c) => catSel === "todas" || c.id === catSel)
      .map((c) => ({
        ...c,
        subcategorias: q
          ? c.subcategorias.filter(
              (s) =>
                normalizar(s.nome).includes(q) ||
                normalizar(c.nome).includes(q) ||
                s.colocados.some((x) => normalizar(x.nome).includes(q))
            )
          : c.subcategorias,
      }))
      .filter((c) => c.subcategorias.length > 0);
  }, [categorias, busca, catSel]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy-800/40" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar categoria ou empresa…"
            className="w-full rounded-md border border-[rgba(10,42,94,0.2)] bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
          />
        </label>
        <select
          value={catSel}
          onChange={(e) => setCatSel(e.target.value)}
          className="rounded-md border border-[rgba(10,42,94,0.2)] bg-white px-3 py-2.5 text-sm"
        >
          <option value="todas">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {filtradas.length === 0 && (
        <p className="text-center text-muted py-12">Nada encontrado.</p>
      )}

      {filtradas.map((c) => (
        <section key={c.id}>
          <h2 className="font-display-bold text-navy-800 text-2xl mb-4">{c.nome}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.subcategorias.map((s) => (
              <article
                key={s.id}
                className="rounded-sm bg-cream-100 border border-[rgba(10,42,94,0.15)] p-5"
              >
                <h3 className="font-semibold text-navy-800 leading-snug">{s.nome}</h3>
                <p className="text-xs text-muted mb-3">
                  {s.total.toLocaleString("pt-BR")} votos
                </p>
                <ol className="space-y-2">
                  {s.colocados.map((x, i) => {
                    const pct = s.total > 0 ? Math.round((x.votos / s.total) * 1000) / 10 : 0;
                    return (
                      <li key={i} className="flex items-center gap-3">
                        <span
                          className={`shrink-0 w-8 h-8 rounded-full grid place-items-center text-xs font-bold ${MEDALHAS[i].cls}`}
                        >
                          {MEDALHAS[i].label}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate ${i === 0 ? "font-bold text-navy-900" : "text-navy-800"}`} title={x.nome}>
                            {x.nome}
                          </p>
                          <p className="text-xs text-muted">
                            {x.votos.toLocaleString("pt-BR")} votos · {pct.toLocaleString("pt-BR")}%
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
