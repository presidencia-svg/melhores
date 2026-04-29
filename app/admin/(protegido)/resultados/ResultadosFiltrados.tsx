"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Trophy, Medal, Search, X } from "lucide-react";

type Resultado = {
  candidato_id: string;
  candidato_nome: string;
  origem: string;
  subcategoria_id: string;
  subcategoria_nome: string;
  categoria_id: string;
  categoria_nome: string;
  total_votos: number;
};

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

  const limpar = () => {
    setBusca("");
    setCategoria("todas");
    setFiltroDisputa("todos");
    setSemVotos(false);
  };

  const ativos =
    busca !== "" ||
    categoria !== "todas" ||
    filtroDisputa !== "todos" ||
    semVotos;

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
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

      <p className="text-xs text-muted mb-4">
        Mostrando <strong>{filtrados.length}</strong> de {grupos.length}{" "}
        subcategorias
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        {filtrados.map((g) => (
          <Card key={`${g.categoria}|${g.subcategoria}`}>
            <CardContent>
              <div className="mb-3 pb-3 border-b border-border flex items-baseline justify-between gap-2">
                <div>
                  <p className="text-xs uppercase font-semibold tracking-wider text-cdl-green">
                    {g.categoria}
                  </p>
                  <h3 className="font-display text-lg font-bold text-cdl-blue">
                    Melhor {g.subcategoria.toLowerCase()}
                  </h3>
                </div>
                <span className="text-xs text-muted shrink-0">
                  {g.candidatos.length} candidatos
                </span>
              </div>
              <ol
                className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1"
                style={{ scrollbarGutter: "stable" }}
              >
                {g.candidatos.map((c, idx) => (
                  <li
                    key={c.candidato_id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                      idx === 0 && c.total_votos > 0
                        ? "bg-cdl-yellow/15 border border-cdl-yellow/30"
                        : ""
                    }`}
                  >
                    <span className="w-6 text-center font-bold text-muted">
                      {idx === 0 && c.total_votos > 0 ? (
                        <Trophy className="w-4 h-4 text-cdl-yellow-dark inline" />
                      ) : idx === 1 && c.total_votos > 0 ? (
                        <Medal className="w-4 h-4 text-zinc-400 inline" />
                      ) : (
                        idx + 1
                      )}
                    </span>
                    <span className="flex-1 text-sm font-medium truncate">
                      {c.candidato_nome}
                    </span>
                    {c.origem === "sugerido" && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-cdl-blue/10 text-cdl-blue">
                        sugerido
                      </span>
                    )}
                    <span className="font-bold text-cdl-blue tabular-nums">
                      {c.total_votos}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtrados.length === 0 && (
        <p className="text-center text-muted py-12">
          Nenhuma subcategoria bate com os filtros.
        </p>
      )}
    </>
  );
}
