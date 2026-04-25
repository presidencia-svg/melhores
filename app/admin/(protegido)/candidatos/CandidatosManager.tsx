"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Upload, FileText } from "lucide-react";

type Sub = { id: string; nome: string; categoria: { nome: string } };

export function CandidatosManager({ subcategorias }: { subcategorias: Sub[] }) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<{ inseridos: number; ignorados: number; erros: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  async function importar() {
    if (!arquivo) return;
    setLoading(true);
    setResultado(null);
    const fd = new FormData();
    fd.append("file", arquivo);
    const res = await fetch("/api/admin/candidatos/importar", { method: "POST", body: fd });
    const data = await res.json();
    setResultado(data);
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cdl-blue/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-cdl-blue" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-cdl-blue">Importar candidatos via CSV</h2>
              <p className="text-sm text-muted">
                Formato esperado: <code className="bg-zinc-100 px-1 rounded">categoria,subcategoria,nome,descricao,foto_url</code>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-cdl-blue file:text-white hover:file:bg-cdl-blue-dark file:cursor-pointer cursor-pointer"
            />
            <Button onClick={importar} disabled={!arquivo} loading={loading}>
              Importar
            </Button>
          </div>

          {resultado && (
            <div className="mt-4 p-3 rounded-xl bg-cdl-green/10 border border-cdl-green/30 text-sm">
              <p className="font-semibold text-cdl-green-dark">
                ✓ {resultado.inseridos} candidatos inseridos
                {resultado.ignorados > 0 && ` · ${resultado.ignorados} ignorados`}
              </p>
              {resultado.erros.length > 0 && (
                <ul className="mt-2 text-xs text-muted list-disc pl-4">
                  {resultado.erros.slice(0, 5).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-muted mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">Subcategorias disponíveis ({subcategorias.length})</h3>
              <div className="grid sm:grid-cols-2 gap-1 text-xs text-muted max-h-64 overflow-y-auto">
                {subcategorias.map((s) => (
                  <div key={s.id} className="px-2 py-1 rounded bg-zinc-50">
                    <strong>{s.categoria.nome}</strong> → {s.nome}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
