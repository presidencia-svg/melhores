import Link from "next/link";
import { ArrowLeft, Archive } from "lucide-react";

// Banner que aparece quando uma pagina admin esta visualizando uma
// edicao historica (nao a ativa) — passada via ?edicao=<uuid>.
// Mostra qual edicao + link de volta pra ativa.
export function HistoricoBanner({
  edicaoNome,
  ano,
  voltarHref = "?",
}: {
  edicaoNome: string;
  ano: number;
  voltarHref?: string;
}) {
  return (
    <div className="mb-6 rounded-lg border-l-4 border-cdl-yellow bg-cdl-yellow/10 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-navy-800">
        <Archive className="w-4 h-4 shrink-0" />
        <span>
          Visualizando edição arquivada:{" "}
          <strong className="font-display-bold">{edicaoNome}</strong>{" "}
          <span className="font-mono text-xs text-muted">({ano})</span>
        </span>
      </div>
      <Link
        href={voltarHref}
        className="text-xs text-cdl-blue hover:underline flex items-center gap-1"
      >
        <ArrowLeft className="w-3 h-3" /> Voltar pra edição atual
      </Link>
    </div>
  );
}
