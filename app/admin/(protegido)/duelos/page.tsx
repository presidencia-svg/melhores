import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Swords, Flame } from "lucide-react";

const TOPS = [10, 25, 50, "all"] as const;

type Duelo = {
  subcategoria_id: string;
  subcategoria_nome: string;
  top1_id: string;
  top1_nome: string;
  top1_foto: string | null;
  top1_votos: number;
  top2_id: string;
  top2_nome: string;
  top2_foto: string | null;
  top2_votos: number;
  total_votos: number;
  diff: number;
  diff_pct: number;
};

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
            Top 1 vs Top 2 de cada subcategoria — ordenados pelo mais acirrado.
            Tira print do card pra postar no Instagram.
          </p>
        </div>
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
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {visiveis.map((d) => (
            <DueloCard key={d.subcategoria_id} duelo={d} />
          ))}
        </div>
      )}
    </div>
  );
}

function DueloCard({ duelo }: { duelo: Duelo }) {
  const total = duelo.top1_votos + duelo.top2_votos;
  const pct1 = total > 0 ? (duelo.top1_votos / total) * 100 : 50;
  const pct2 = total > 0 ? (duelo.top2_votos / total) * 100 : 50;
  const acirrado = duelo.diff_pct <= 10;

  return (
    <article className="aspect-square bg-cdl-blue text-white rounded-2xl overflow-hidden flex flex-col p-6 relative shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.15em] font-semibold opacity-80">
        <span>Melhores do Ano CDL</span>
        {acirrado && (
          <span className="flex items-center gap-1 text-amber-300">
            <Flame className="w-3 h-3" />
            acirrado
          </span>
        )}
      </div>

      <h2 className="font-display text-xl font-bold mt-1 leading-tight line-clamp-2">
        {duelo.subcategoria_nome}
      </h2>

      {/* Duelo */}
      <div className="flex-1 flex items-center justify-between gap-3 my-4">
        <Lado
          nome={duelo.top1_nome}
          foto={duelo.top1_foto}
          votos={duelo.top1_votos}
          pct={pct1}
          ganhando
        />
        <div className="font-display italic text-2xl text-amber-300 shrink-0">
          vs
        </div>
        <Lado
          nome={duelo.top2_nome}
          foto={duelo.top2_foto}
          votos={duelo.top2_votos}
          pct={pct2}
        />
      </div>

      {/* Barra de proporcao */}
      <div className="h-3 rounded-full bg-white/10 overflow-hidden flex">
        <div
          className="bg-amber-300 h-full"
          style={{ width: `${pct1}%` }}
        />
        <div
          className="bg-white h-full"
          style={{ width: `${pct2}%` }}
        />
      </div>
      <div className="flex justify-between text-xs font-mono mt-1 opacity-90">
        <span>{pct1.toFixed(1)}%</span>
        <span className="opacity-70">
          dif {duelo.diff} {duelo.diff === 1 ? "voto" : "votos"} · {duelo.diff_pct}%
        </span>
        <span>{pct2.toFixed(1)}%</span>
      </div>

      {/* CTA */}
      <p className="text-center text-xs mt-4 opacity-90 font-semibold">
        Ainda dá tempo de virar!
        <br />
        <span className="text-amber-300">votar.cdlaju.com.br</span>
      </p>
    </article>
  );
}

function Lado({
  nome,
  foto,
  votos,
  pct,
  ganhando,
}: {
  nome: string;
  foto: string | null;
  votos: number;
  pct: number;
  ganhando?: boolean;
}) {
  const inicial = nome.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex-1 min-w-0 flex flex-col items-center">
      <div
        className={`relative w-20 h-20 rounded-full overflow-hidden border-2 ${
          ganhando ? "border-amber-300" : "border-white/40"
        } bg-white/10 flex items-center justify-center`}
      >
        {foto ? (
          // next/image precisaria do remotePatterns; img nativo funciona certinho
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            alt={nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-display text-2xl text-white">{inicial}</span>
        )}
      </div>
      <p
        className="text-sm font-semibold mt-2 text-center line-clamp-2 leading-tight"
        title={nome}
      >
        {nome}
      </p>
      <p
        className={`font-display text-2xl mt-1 ${
          ganhando ? "text-amber-300" : "text-white"
        }`}
      >
        {pct.toFixed(1)}%
      </p>
      <p className="text-[10px] opacity-70 font-mono">
        {votos.toLocaleString("pt-BR")} {votos === 1 ? "voto" : "votos"}
      </p>
    </div>
  );
}
