"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Copy, Download, Check } from "lucide-react";

export type LinhaTop6 = {
  subcategoria_id: string;
  subcategoria_nome: string;
  categoria_id: string;
  categoria_nome: string;
  candidato_id: string;
  candidato_nome: string;
  total_votos: number;
  posicao: number;
};

type Modo = "categoria" | "alfabetica";

const MEDALHAS = ["🥇", "🥈", "🥉", "4º", "5º", "6º"];

function fmtVotos(n: number): string {
  return n.toLocaleString("pt-BR");
}

// Gera o texto da release nos dois formatos (categoria | A-Z).
function gerarTexto(linhas: LinhaTop6[], modo: Modo): string {
  if (modo === "categoria") {
    const porCat = new Map<string, Map<string, LinhaTop6[]>>();
    for (const l of linhas) {
      if (!porCat.has(l.categoria_nome)) porCat.set(l.categoria_nome, new Map());
      const subs = porCat.get(l.categoria_nome)!;
      if (!subs.has(l.subcategoria_nome)) subs.set(l.subcategoria_nome, []);
      subs.get(l.subcategoria_nome)!.push(l);
    }
    const cats = Array.from(porCat.entries()).sort(([a], [b]) =>
      a.localeCompare(b, "pt-BR")
    );
    const blocos: string[] = [];
    for (const [cat, subs] of cats) {
      const subList = Array.from(subs.entries()).sort(([a], [b]) =>
        a.localeCompare(b, "pt-BR")
      );
      const sub_blocos: string[] = [];
      for (const [sub, cands] of subList) {
        const linhasCands = cands
          .sort((a, b) => a.posicao - b.posicao)
          .map(
            (c) =>
              `  ${MEDALHAS[c.posicao - 1] ?? `${c.posicao}º`} ${c.candidato_nome} (${fmtVotos(c.total_votos)})`
          );
        sub_blocos.push(`${sub}\n${linhasCands.join("\n")}`);
      }
      blocos.push(`${cat.toUpperCase()}\n\n${sub_blocos.join("\n\n")}`);
    }
    return [
      "MELHORES DO ANO · CDL ARACAJU 2026",
      "Top 6 colocados por subcategoria",
      "",
      ...blocos,
    ].join("\n\n");
  }

  // modo alfabetico (subcategoria A-Z, sem categoria)
  const porSub = new Map<string, LinhaTop6[]>();
  for (const l of linhas) {
    if (!porSub.has(l.subcategoria_nome)) porSub.set(l.subcategoria_nome, []);
    porSub.get(l.subcategoria_nome)!.push(l);
  }
  const subs = Array.from(porSub.entries()).sort(([a], [b]) =>
    a.localeCompare(b, "pt-BR")
  );
  const blocos: string[] = [];
  for (const [sub, cands] of subs) {
    const linhasCands = cands
      .sort((a, b) => a.posicao - b.posicao)
      .map(
        (c) =>
          `  ${MEDALHAS[c.posicao - 1] ?? `${c.posicao}º`} ${c.candidato_nome} (${fmtVotos(c.total_votos)})`
      );
    blocos.push(`${sub.toUpperCase()}\n${linhasCands.join("\n")}`);
  }
  return [
    "MELHORES DO ANO · CDL ARACAJU 2026",
    "Top 6 colocados por subcategoria (ordem alfabética)",
    "",
    ...blocos,
  ].join("\n\n");
}

export function ImprensaLista({ linhas }: { linhas: LinhaTop6[] }) {
  const [modo, setModo] = useState<Modo>("categoria");
  const [copiado, setCopiado] = useState(false);

  const texto = useMemo(() => gerarTexto(linhas, modo), [linhas, modo]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      alert("Não consegui copiar — selecione o texto e copie manualmente.");
    }
  }

  function baixar() {
    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sufixo = modo === "categoria" ? "por-categoria" : "alfabetica";
    link.download = `melhores-do-ano-2026-top6-${sufixo}.txt`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Conta total de subs e candidatos pra mostrar no header
  const subsUnicas = new Set(linhas.map((l) => l.subcategoria_nome)).size;

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <nav className="flex gap-1 bg-cream-100 border border-[rgba(10,42,94,0.15)] rounded-lg p-1">
          <button
            type="button"
            onClick={() => setModo("categoria")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              modo === "categoria"
                ? "bg-cdl-blue text-white"
                : "text-cdl-blue hover:bg-cdl-blue/10"
            }`}
          >
            Por categoria
          </button>
          <button
            type="button"
            onClick={() => setModo("alfabetica")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              modo === "alfabetica"
                ? "bg-cdl-blue text-white"
                : "text-cdl-blue hover:bg-cdl-blue/10"
            }`}
          >
            A–Z
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {subsUnicas} subcategorias · {linhas.length} linhas
          </span>
          <button
            type="button"
            onClick={copiar}
            className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
              copiado
                ? "bg-emerald-600 text-white"
                : "bg-cdl-blue text-white hover:bg-cdl-blue-dark"
            }`}
          >
            {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiado ? "Copiado!" : "Copiar tudo"}
          </button>
          <button
            type="button"
            onClick={baixar}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-cdl-green text-white text-sm font-medium hover:bg-cdl-green-dark transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar .txt
          </button>
        </div>
      </div>

      <Card>
        <CardContent>
          <pre className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-foreground">
            {texto}
          </pre>
        </CardContent>
      </Card>
    </>
  );
}
