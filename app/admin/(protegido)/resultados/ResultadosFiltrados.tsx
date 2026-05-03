"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Trophy,
  Medal,
  Search,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type Resultado = {
  candidato_id: string;
  candidato_nome: string;
  origem: string;
  subcategoria_id: string;
  subcategoria_nome: string;
  categoria_id: string;
  categoria_nome: string;
  total_votos: number;
  pct_spc?: number | null;
  pct_wa?: number | null;
  pct_selfie?: number | null;
  pct_fp_comp?: number | null;
  pct_ip_comp?: number | null;
  score_risco?: number | null;
};

// Calibrado por auditoria: a edicao teve score medio ~17, todos os casos
// que mereceram drill-down tinham score >= 22.
function tomRisco(score: number | null | undefined): {
  label: string;
  classes: string;
} {
  const s = Number(score ?? 0);
  if (s >= 28) return { label: "alto", classes: "bg-rose-100 text-rose-700 ring-rose-300" };
  if (s >= 22) return { label: "medio", classes: "bg-amber-100 text-amber-800 ring-amber-300" };
  return { label: "baixo", classes: "bg-emerald-100 text-emerald-700 ring-emerald-300" };
}

type Grupo = {
  categoria: string;
  subcategoria: string;
  candidatos: Resultado[];
};

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function diferencaTopo(c: Resultado[]): number {
  if (c.length < 2) return Infinity;
  return c[0].total_votos - c[1].total_votos;
}

export function ResultadosFiltrados({ grupos }: { grupos: Grupo[] }) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("todas");
  const [filtroDisputa, setFiltroDisputa] = useState<
    "todos" | "empates" | "acirradas"
  >("todos");
  const [semVotos, setSemVotos] = useState(false);
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());
  const [colapsadas, setColapsadas] = useState<Set<string>>(new Set());

  const categorias = useMemo(() => {
    const set = new Set(grupos.map((g) => g.categoria));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [grupos]);

  const filtrados = useMemo(() => {
    const buscaNorm = normalizar(busca);
    return grupos.filter((g) => {
      if (categoria !== "todas" && g.categoria !== categoria) return false;

      const totalVotos = g.candidatos.reduce((s, c) => s + c.total_votos, 0);
      if (semVotos && totalVotos > 0) return false;

      if (filtroDisputa === "empates") {
        if (g.candidatos.length < 2) return false;
        if (g.candidatos[0].total_votos === 0) return false;
        if (diferencaTopo(g.candidatos) !== 0) return false;
      } else if (filtroDisputa === "acirradas") {
        if (g.candidatos.length < 2) return false;
        if (g.candidatos[0].total_votos === 0) return false;
        if (diferencaTopo(g.candidatos) > 5) return false;
      }

      if (buscaNorm) {
        const matchSub = normalizar(g.subcategoria).includes(buscaNorm);
        const matchCat = normalizar(g.categoria).includes(buscaNorm);
        const matchCand = g.candidatos.some((c) =>
          normalizar(c.candidato_nome).includes(buscaNorm)
        );
        if (!matchSub && !matchCat && !matchCand) return false;
      }
      return true;
    });
  }, [grupos, busca, categoria, filtroDisputa, semVotos]);

  const porCategoria = useMemo(() => {
    const map = new Map<string, Grupo[]>();
    for (const g of filtrados) {
      if (!map.has(g.categoria)) map.set(g.categoria, []);
      map.get(g.categoria)!.push(g);
    }
    return Array.from(map.entries()).sort(([a], [b]) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [filtrados]);

  const limpar = () => {
    setBusca("");
    setCategoria("todas");
    setFiltroDisputa("todos");
    setSemVotos(false);
    setExpandidas(new Set());
    setColapsadas(new Set());
  };

  const toggleCard = (key: string) => {
    setExpandidas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleCategoria = (cat: string) => {
    setColapsadas((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const ativos =
    busca !== "" ||
    categoria !== "todas" ||
    filtroDisputa !== "todos" ||
    semVotos;

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar subcategoria, categoria ou candidato…"
            className="w-full h-10 pl-9 pr-3 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cdl-blue/30"
          />
        </div>

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="h-10 px-3 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cdl-blue/30"
        >
          <option value="todas">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filtroDisputa}
          onChange={(e) =>
            setFiltroDisputa(e.target.value as typeof filtroDisputa)
          }
          className="h-10 px-3 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cdl-blue/30"
        >
          <option value="todos">Toda disputa</option>
          <option value="empates">Só empates</option>
          <option value="acirradas">Acirradas (≤ 5 votos)</option>
        </select>

        <label className="inline-flex items-center gap-2 text-sm text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={semVotos}
            onChange={(e) => setSemVotos(e.target.checked)}
            className="w-4 h-4 accent-cdl-blue cursor-pointer"
          />
          Sem votos
        </label>

        {ativos && (
          <button
            onClick={limpar}
            className="inline-flex items-center gap-1 h-10 px-3 rounded-md text-sm text-muted hover:text-navy-800 hover:bg-cream-100"
          >
            <X className="w-3.5 h-3.5" /> limpar
          </button>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between text-xs text-muted">
        <p>
          <strong>{filtrados.length}</strong> de {grupos.length} subcategorias ·{" "}
          <strong>{porCategoria.length}</strong>{" "}
          {porCategoria.length === 1 ? "categoria" : "categorias"}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpandidas(new Set(filtrados.map((g) => `${g.categoria}|${g.subcategoria}`)))}
            className="hover:text-navy-800"
          >
            expandir tudo
          </button>
          <span>·</span>
          <button
            onClick={() => setExpandidas(new Set())}
            className="hover:text-navy-800"
          >
            recolher tudo
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {porCategoria.map(([cat, gruposDaCat]) => {
          const colapsada = colapsadas.has(cat);
          return (
            <section key={cat}>
              <button
                onClick={() => toggleCategoria(cat)}
                className="w-full flex items-center gap-2 mb-2 px-1 py-1 rounded hover:bg-cream-100 group"
              >
                {colapsada ? (
                  <ChevronRight className="w-4 h-4 text-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted" />
                )}
                <h2 className="font-display-bold text-cdl-green text-sm uppercase tracking-wider">
                  {cat}
                </h2>
                <span className="text-xs text-muted">
                  ({gruposDaCat.length}{" "}
                  {gruposDaCat.length === 1 ? "subcategoria" : "subcategorias"})
                </span>
              </button>

              {!colapsada && (
                <div className="grid lg:grid-cols-2 gap-3">
                  {gruposDaCat.map((g) => {
                    const key = `${g.categoria}|${g.subcategoria}`;
                    const expandida = expandidas.has(key);
                    const lider = g.candidatos[0];
                    const segundo = g.candidatos[1];
                    const diff =
                      lider && segundo
                        ? lider.total_votos - segundo.total_votos
                        : null;
                    const empate =
                      diff === 0 && lider && lider.total_votos > 0;
                    const totalVotos = g.candidatos.reduce(
                      (s, c) => s + c.total_votos,
                      0
                    );

                    return (
                      <Card key={key}>
                        <CardContent className="!p-3">
                          <button
                            onClick={() => toggleCard(key)}
                            className="w-full flex items-start gap-2 text-left"
                          >
                            {expandida ? (
                              <ChevronDown className="w-4 h-4 text-muted shrink-0 mt-1" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted shrink-0 mt-1" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-display text-sm font-bold text-cdl-blue truncate">
                                Melhor {g.subcategoria.toLowerCase()}
                              </h3>
                              {lider && lider.total_votos > 0 ? (
                                <div className="mt-1 flex items-center gap-2 text-sm">
                                  <Trophy className="w-3.5 h-3.5 text-cdl-yellow-dark shrink-0" />
                                  <span className="font-medium text-navy-800 truncate">
                                    {lider.candidato_nome}
                                  </span>
                                  <span className="font-bold text-cdl-blue tabular-nums shrink-0">
                                    {lider.total_votos}
                                  </span>
                                  {segundo && (
                                    <span
                                      className={`text-xs shrink-0 ${
                                        empate
                                          ? "text-red-600 font-semibold"
                                          : diff !== null && diff <= 5
                                            ? "text-orange-600"
                                            : "text-muted"
                                      }`}
                                    >
                                      {empate
                                        ? "empate"
                                        : `+${diff}`}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <p className="mt-1 text-xs text-muted">
                                  sem votos · {g.candidatos.length} candidatos
                                </p>
                              )}
                              <p className="text-[11px] text-muted mt-1">
                                {g.candidatos.length} candidatos · {totalVotos}{" "}
                                {totalVotos === 1 ? "voto" : "votos"}
                              </p>
                            </div>
                          </button>

                          {expandida && (
                            <ol
                              className="mt-3 pt-3 border-t border-border flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-1"
                              style={{ scrollbarGutter: "stable" }}
                            >
                              {g.candidatos.map((c, idx) => {
                                const risco = tomRisco(c.score_risco);
                                const temRisco = c.total_votos > 0 && c.score_risco != null;
                                const tooltipRisco = temRisco
                                  ? `risco ${risco.label} · score ${Number(c.score_risco).toFixed(1)}\n` +
                                    `spc ${c.pct_spc ?? 0}% · wa ${c.pct_wa ?? 0}% · selfie ${c.pct_selfie ?? 0}%\n` +
                                    `fp compartilhado ${c.pct_fp_comp ?? 0}% · ip compartilhado ${c.pct_ip_comp ?? 0}%`
                                  : undefined;
                                return (
                                  <li
                                    key={c.candidato_id}
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded ${
                                      idx === 0 && c.total_votos > 0
                                        ? "bg-cdl-yellow/15"
                                        : ""
                                    }`}
                                  >
                                    <span className="w-5 text-center text-xs font-bold text-muted">
                                      {idx === 0 && c.total_votos > 0 ? (
                                        <Trophy className="w-3.5 h-3.5 text-cdl-yellow-dark inline" />
                                      ) : idx === 1 && c.total_votos > 0 ? (
                                        <Medal className="w-3.5 h-3.5 text-zinc-400 inline" />
                                      ) : (
                                        idx + 1
                                      )}
                                    </span>
                                    <span className="flex-1 text-xs font-medium truncate">
                                      {c.candidato_nome}
                                    </span>
                                    {c.origem === "sugerido" && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cdl-blue/10 text-cdl-blue">
                                        sugerido
                                      </span>
                                    )}
                                    {temRisco && (
                                      <span
                                        title={tooltipRisco}
                                        className={`text-[10px] px-1.5 py-0.5 rounded ring-1 font-mono tabular-nums ${risco.classes}`}
                                      >
                                        {Number(c.score_risco).toFixed(0)}
                                      </span>
                                    )}
                                    <span className="text-xs font-bold text-cdl-blue tabular-nums">
                                      {c.total_votos}
                                    </span>
                                  </li>
                                );
                              })}
                            </ol>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {filtrados.length === 0 && (
        <p className="text-center text-muted py-12">
          Nenhuma subcategoria bate com os filtros.
        </p>
      )}
    </>
  );
}
