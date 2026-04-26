"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pencil, GitMerge, Trash2, Check, X } from "lucide-react";

type Candidato = {
  id: string;
  nome: string;
  descricao: string | null;
  foto_url: string | null;
  origem: string;
  status: string;
  sugestoes_count: number;
  subcategoria: { id: string; nome: string; categoria: { nome: string } };
};

export function CandidatosLista({ candidatos }: { candidatos: Candidato[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("");
  const [filtroSubcategoria, setFiltroSubcategoria] = useState<string>("");
  const [editando, setEditando] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [merging, setMerging] = useState<{ origem: Candidato; destino: string | null } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Lista de categorias únicas
  const categorias = useMemo(() => {
    const set = new Set<string>();
    candidatos.forEach((c) => set.add(c.subcategoria.categoria.nome));
    return Array.from(set).sort();
  }, [candidatos]);

  // Subcategorias filtradas pela categoria selecionada
  const subcategoriasDisp = useMemo(() => {
    const set = new Set<string>();
    candidatos
      .filter((c) => !filtroCategoria || c.subcategoria.categoria.nome === filtroCategoria)
      .forEach((c) => set.add(c.subcategoria.nome));
    return Array.from(set).sort();
  }, [candidatos, filtroCategoria]);

  const filtrados = useMemo(() => {
    let lista = candidatos;
    if (filtroCategoria) {
      lista = lista.filter((c) => c.subcategoria.categoria.nome === filtroCategoria);
    }
    if (filtroSubcategoria) {
      lista = lista.filter((c) => c.subcategoria.nome === filtroSubcategoria);
    }
    if (busca) {
      const t = busca.toLowerCase();
      lista = lista.filter(
        (c) =>
          c.nome.toLowerCase().includes(t) ||
          c.subcategoria.nome.toLowerCase().includes(t) ||
          c.subcategoria.categoria.nome.toLowerCase().includes(t)
      );
    }
    return lista;
  }, [busca, filtroCategoria, filtroSubcategoria, candidatos]);

  // Detecta duplicados (mesmo nome normalizado na mesma subcategoria)
  const duplicadosSet = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of candidatos) {
      const key = `${c.subcategoria.id}::${c.nome.trim().toLowerCase()}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const dup = new Set<string>();
    for (const c of candidatos) {
      const key = `${c.subcategoria.id}::${c.nome.trim().toLowerCase()}`;
      if ((map.get(key) ?? 0) > 1) dup.add(c.id);
    }
    return dup;
  }, [candidatos]);

  function limparFiltros() {
    setBusca("");
    setFiltroCategoria("");
    setFiltroSubcategoria("");
  }

  async function renomear(id: string) {
    if (!novoNome.trim() || novoNome.trim().length < 2) return;
    setLoading(id);
    setErro(null);
    const res = await fetch(`/api/admin/candidatos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: novoNome.trim() }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErro(d.error ?? "Falha ao renomear");
    } else {
      setEditando(null);
      router.refresh();
    }
    setLoading(null);
  }

  async function excluir(id: string) {
    if (!confirm("Excluir candidato e todos os votos vinculados?")) return;
    setLoading(id);
    setErro(null);
    const res = await fetch(`/api/admin/candidatos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErro(d.error ?? "Falha ao excluir");
    } else {
      router.refresh();
    }
    setLoading(null);
  }

  async function mesclar() {
    if (!merging || !merging.destino) return;
    setLoading(merging.origem.id);
    setErro(null);
    const res = await fetch("/api/admin/candidatos/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origemId: merging.origem.id, destinoId: merging.destino }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErro(data.error ?? "Falha ao mesclar");
    } else {
      const msg = `✓ ${data.votos_movidos} votos movidos${
        data.conflitos_descartados > 0 ? ` (${data.conflitos_descartados} conflitos descartados)` : ""
      }`;
      alert(msg);
      setMerging(null);
      router.refresh();
    }
    setLoading(null);
  }

  // Pra escolher destino do merge: candidatos da MESMA subcategoria
  const destinosPossiveis = merging
    ? candidatos.filter(
        (c) => c.subcategoria.id === merging.origem.subcategoria.id && c.id !== merging.origem.id
      )
    : [];

  const totalDup = duplicadosSet.size;
  const algumFiltroAtivo = busca || filtroCategoria || filtroSubcategoria;

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-cdl-blue">Gerenciar candidatos</h2>
          <span className="text-xs text-muted">
            {filtrados.length} de {candidatos.length}
            {totalDup > 0 && (
              <span className="ml-2 text-orange-600 font-semibold">· {totalDup} duplicados</span>
            )}
          </span>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <select
            value={filtroCategoria}
            onChange={(e) => {
              setFiltroCategoria(e.target.value);
              setFiltroSubcategoria("");
            }}
            className="h-11 px-3 rounded-xl border-2 border-border bg-white text-sm font-medium focus:outline-none focus:border-cdl-blue"
          >
            <option value="">Todas as categorias</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filtroSubcategoria}
            onChange={(e) => setFiltroSubcategoria(e.target.value)}
            disabled={!filtroCategoria && subcategoriasDisp.length > 30}
            className="h-11 px-3 rounded-xl border-2 border-border bg-white text-sm font-medium focus:outline-none focus:border-cdl-blue disabled:opacity-50"
          >
            <option value="">Todas as subcategorias</option>
            {subcategoriasDisp.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nome…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="!h-11 flex-1"
            />
            {algumFiltroAtivo && (
              <Button variant="ghost" size="sm" onClick={limparFiltros} title="Limpar filtros">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {totalDup > 0 && !algumFiltroAtivo && (
          <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 px-3 py-2 rounded-lg mb-3">
            ⚠ Existem {totalDup} candidatos duplicados (mesmo nome na mesma subcategoria). Use o filtro pra encontrá-los e mesclar/excluir.
          </p>
        )}

        {erro && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{erro}</div>
        )}

        <div className="max-h-[600px] overflow-y-auto divide-y divide-border">
          {filtrados.length === 0 && (
            <p className="text-center text-muted py-12 text-sm">
              {algumFiltroAtivo
                ? "Nenhum candidato encontrado com esses filtros."
                : "Nenhum candidato cadastrado ainda."}
            </p>
          )}

          {filtrados.map((c) => {
            const editing = editando === c.id;
            return (
              <div key={c.id} className="py-2 flex items-center gap-3 text-sm">
                {editing ? (
                  <>
                    <Input
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      className="!h-9 flex-1"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => renomear(c.id)}
                      loading={loading === c.id}
                      disabled={!novoNome.trim()}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditando(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{c.nome}</span>
                        {c.origem === "sugerido" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cdl-blue/10 text-cdl-blue font-semibold">
                            sugerido
                          </span>
                        )}
                        {duplicadosSet.has(c.id) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-semibold">
                            duplicado
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted truncate">
                        {c.subcategoria.categoria.nome} → {c.subcategoria.nome}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditando(c.id);
                        setNovoNome(c.nome);
                      }}
                      title="Renomear"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setMerging({ origem: c, destino: null })}
                      title="Mesclar com outro candidato"
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => excluir(c.id)}
                      loading={loading === c.id}
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </Button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {merging && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardContent>
                <h3 className="font-display text-lg font-bold text-cdl-blue mb-2">Mesclar candidato</h3>
                <p className="text-sm text-muted mb-3">
                  Os votos de <strong>{merging.origem.nome}</strong> serão transferidos para o candidato escolhido. Em seguida, <strong>{merging.origem.nome}</strong> será excluído.
                </p>
                <p className="text-xs text-muted mb-4">
                  Subcategoria: {merging.origem.subcategoria.categoria.nome} → {merging.origem.subcategoria.nome}
                </p>

                <label className="text-sm font-medium block mb-2">Mesclar para:</label>
                <select
                  className="w-full h-11 px-3 rounded-xl border-2 border-border bg-white text-sm"
                  value={merging.destino ?? ""}
                  onChange={(e) => setMerging({ ...merging, destino: e.target.value || null })}
                >
                  <option value="">— Escolher candidato —</option>
                  {destinosPossiveis.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
                </select>

                {destinosPossiveis.length === 0 && (
                  <p className="text-xs text-orange-600 mt-2">
                    ⚠ Nenhum outro candidato nessa subcategoria.
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => setMerging(null)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button
                    onClick={mesclar}
                    disabled={!merging.destino}
                    loading={loading === merging.origem.id}
                    className="flex-1"
                  >
                    Mesclar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
