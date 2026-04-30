import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Swords } from "lucide-react";
import { DuelosLista, type Duelo } from "./DuelosLista";
import { AtualizarBtn } from "./AtualizarBtn";

const TOPS = [10, 25, 50, "all"] as const;

function clampTop(input: string | undefined): number | null {
  if (input === "all") return null;
  const n = parseInt(input ?? "10", 10);
  if (!Number.isFinite(n)) return 10;
  if (n < 1) return 1;
  if (n > 200) return 200;
  return n;
}

export default async function DuelosPage({
  searchParams,
}: {
  searchParams: Promise<{ top?: string }>;
}) {
  const sp = await searchParams;
  const limit = clampTop(sp.top);
  const supabase = createSupabaseAdminClient();

  const { data: duelos } = await supabase
    .from("v_duelos")
    .select("*")
    .order("diff", { ascending: true })
    .order("total_votos", { ascending: false });

  const lista = (duelos ?? []) as Duelo[];
  const visiveis = limit ? lista.slice(0, limit) : lista;

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-cdl-blue flex items-center gap-2">
            <Swords className="w-7 h-7 text-cdl-green" />
            Duelos
          </h1>
          <p className="text-muted mt-1">
            Top 1 vs Top 2 de cada subcategoria, ordenados pelo mais acirrado.
            Baixa em formato Feed (1:1) ou Story (9:16) pra postar no Instagram.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <nav className="flex gap-1 bg-cream-100 border border-[rgba(10,42,94,0.15)] rounded-lg p-1">
            {TOPS.map((p) => {
              const param = String(p);
              const ativo =
                (limit === null && p === "all") ||
                (limit !== null && p === limit);
              return (
                <Link
                  key={param}
                  href={`/admin/duelos?top=${param}`}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    ativo ? "bg-cdl-blue text-white" : "text-cdl-blue hover:bg-cdl-blue/10"
                  }`}
                >
                  {p === "all" ? "todas" : `top ${p}`}
                </Link>
              );
            })}
          </nav>
          <AtualizarBtn />
        </div>
      </header>

      {lista.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted py-12 text-center">
              Sem disputas com pelo menos 2 candidatos com voto ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <DuelosLista duelos={visiveis} />
      )}
    </div>
  );
}
