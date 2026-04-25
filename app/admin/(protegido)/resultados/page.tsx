import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Trophy, Medal } from "lucide-react";

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

export const revalidate = 30;

export default async function ResultadosPage() {
  const supabase = createSupabaseAdminClient();
  const { data: rows } = await supabase.from("v_resultados").select("*");

  const grupos = new Map<string, { categoria: string; subcategoria: string; candidatos: Resultado[] }>();
  for (const r of (rows ?? []) as Resultado[]) {
    const key = `${r.categoria_nome}|${r.subcategoria_nome}`;
    if (!grupos.has(key)) {
      grupos.set(key, { categoria: r.categoria_nome, subcategoria: r.subcategoria_nome, candidatos: [] });
    }
    grupos.get(key)!.candidatos.push(r);
  }

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cdl-blue">Resultados</h1>
        <p className="text-muted mt-1">Atualizado a cada 30 segundos</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-4">
        {Array.from(grupos.values()).map((g) => (
          <Card key={`${g.categoria}|${g.subcategoria}`}>
            <CardContent>
              <div className="mb-3 pb-3 border-b border-border">
                <p className="text-xs uppercase font-semibold tracking-wider text-cdl-green">
                  {g.categoria}
                </p>
                <h3 className="font-display text-lg font-bold text-cdl-blue">
                  Melhor {g.subcategoria.toLowerCase()}
                </h3>
              </div>
              <ol className="flex flex-col gap-2">
                {g.candidatos.slice(0, 10).map((c, idx) => (
                  <li
                    key={c.candidato_id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                      idx === 0 ? "bg-cdl-yellow/15 border border-cdl-yellow/30" : ""
                    }`}
                  >
                    <span className="w-6 text-center font-bold text-muted">
                      {idx === 0 ? <Trophy className="w-4 h-4 text-cdl-yellow-dark inline" /> : idx === 1 ? <Medal className="w-4 h-4 text-zinc-400 inline" /> : idx + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium truncate">{c.candidato_nome}</span>
                    {c.origem === "sugerido" && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-cdl-blue/10 text-cdl-blue">sugerido</span>
                    )}
                    <span className="font-bold text-cdl-blue tabular-nums">{c.total_votos}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>

      {grupos.size === 0 && (
        <p className="text-center text-muted py-12">Sem resultados ainda. Aguarde os primeiros votos.</p>
      )}
    </div>
  );
}
