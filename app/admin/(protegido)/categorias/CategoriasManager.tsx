"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

type Sub = { id: string; nome: string; slug: string; ordem: number; ativa: boolean };
type Cat = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  ordem: number;
  ativa: boolean;
  subcategorias: Sub[];
};

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CategoriasManager({ edicaoId, categorias }: { edicaoId: string; categorias: Cat[] }) {
  const router = useRouter();
  const [aberta, setAberta] = useState<string | null>(null);
  const [novaCat, setNovaCat] = useState("");
  const [novaSubMap, setNovaSubMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  async function call(path: string, body: object): Promise<boolean> {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  }

  async function criarCategoria() {
    if (!novaCat.trim()) return;
    setLoading("nova-cat");
    await call("/api/admin/categorias", { edicaoId, nome: novaCat.trim(), slug: slugify(novaCat) });
    setNovaCat("");
    setLoading(null);
    router.refresh();
  }

  async function excluirCategoria(id: string) {
    if (!confirm("Excluir categoria e todas as subcategorias/candidatos?")) return;
    setLoading(id);
    await fetch(`/api/admin/categorias/${id}`, { method: "DELETE" });
    setLoading(null);
    router.refresh();
  }

  async function criarSubcategoria(catId: string) {
    const nome = (novaSubMap[catId] ?? "").trim();
    if (!nome) return;
    setLoading(`sub-${catId}`);
    await call("/api/admin/subcategorias", { categoriaId: catId, nome, slug: slugify(nome) });
    setNovaSubMap({ ...novaSubMap, [catId]: "" });
    setLoading(null);
    router.refresh();
  }

  async function excluirSub(id: string) {
    if (!confirm("Excluir subcategoria e candidatos?")) return;
    setLoading(id);
    await fetch(`/api/admin/subcategorias/${id}`, { method: "DELETE" });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              label="Nova categoria"
              placeholder="Ex: Alimentação"
              value={novaCat}
              onChange={(e) => setNovaCat(e.target.value)}
            />
          </div>
          <Button
            onClick={criarCategoria}
            loading={loading === "nova-cat"}
            disabled={!novaCat.trim()}
          >
            <Plus className="w-4 h-4" /> Criar
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {categorias.length === 0 && (
          <p className="text-center text-muted py-12">Nenhuma categoria criada ainda.</p>
        )}

        {categorias.map((cat) => {
          const expandida = aberta === cat.id;
          return (
            <Card key={cat.id}>
              <CardContent>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAberta(expandida ? null : cat.id)}
                    className="p-1 hover:bg-cdl-blue/10 rounded transition-colors"
                  >
                    {expandida ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <div className="flex-1">
                    <div className="font-display font-bold text-cdl-blue">{cat.nome}</div>
                    <div className="text-xs text-muted">
                      {cat.subcategorias.length} subcategoria{cat.subcategorias.length !== 1 && "s"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => excluirCategoria(cat.id)}
                    loading={loading === cat.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {expandida && (
                  <div className="mt-4 pl-8 flex flex-col gap-2 border-l-2 border-border">
                    {[...cat.subcategorias].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).map((s) => (
                      <div key={s.id} className="flex items-center gap-3 py-1">
                        <span className="flex-1 text-sm">{s.nome}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => excluirSub(s.id)}
                          loading={loading === s.id}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}

                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Nova subcategoria (ex: Restaurantes)"
                        value={novaSubMap[cat.id] ?? ""}
                        onChange={(e) =>
                          setNovaSubMap({ ...novaSubMap, [cat.id]: e.target.value })
                        }
                        className="!h-10 flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => criarSubcategoria(cat.id)}
                        loading={loading === `sub-${cat.id}`}
                        disabled={!novaSubMap[cat.id]?.trim()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
