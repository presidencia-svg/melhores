"use client";

import { useState } from "react";
import { Printer, Check } from "lucide-react";

export type PlacaItem = {
  id: string;
  nome: string;
  subcategoria: string;
};

export function PlacasPrint({
  placas,
  ano,
  tenantNome,
  cidade,
  logoUrl,
  assinaturaNome,
  assinaturaCargo,
}: {
  placas: PlacaItem[];
  ano: number;
  tenantNome: string;
  cidade: string;
  logoUrl: string | null;
  assinaturaNome: string | null;
  assinaturaCargo: string | null;
}) {
  const temAssinatura = Boolean(assinaturaNome?.trim());
  // Por default, todas selecionadas. Admin desmarca as que NAO vai imprimir.
  const [selecionadas, setSelecionadas] = useState<Set<string>>(
    () => new Set(placas.map((p) => p.id))
  );

  function toggle(id: string) {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function marcarTodas() {
    setSelecionadas(new Set(placas.map((p) => p.id)));
  }

  function desmarcarTodas() {
    setSelecionadas(new Set());
  }

  const qtdSelecionadas = selecionadas.size;

  return (
    <div className="space-y-6">
      {/* CSS de impressao: pagina 150×100mm sem margens, uma placa por pagina.
          .placa-skip esconde no print mas continua visivel na tela
          (com opacidade reduzida + checkbox desmarcado). */}
      <style>{`
        @media print {
          @page { size: 150mm 100mm; margin: 0; }
          html, body { background: #fff !important; }
          .placa-page { page-break-after: always; }
          .placa-page:last-child { page-break-after: auto; }
          .placa-skip { display: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex items-center justify-between gap-4 flex-wrap no-print sticky top-0 bg-background/90 backdrop-blur z-10 py-3 -mx-8 px-8 border-b border-border/50">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm text-muted">
            <strong className="text-cdl-blue tabular-nums">
              {qtdSelecionadas}
            </strong>{" "}
            de <strong className="tabular-nums">{placas.length}</strong>{" "}
            {placas.length === 1 ? "placa selecionada" : "placas selecionadas"}
          </p>
          <button
            onClick={marcarTodas}
            disabled={qtdSelecionadas === placas.length}
            className="text-xs text-cdl-blue hover:underline disabled:opacity-40 disabled:no-underline"
          >
            Marcar todas
          </button>
          <button
            onClick={desmarcarTodas}
            disabled={qtdSelecionadas === 0}
            className="text-xs text-muted hover:text-cdl-blue hover:underline disabled:opacity-40 disabled:no-underline"
          >
            Desmarcar todas
          </button>
        </div>
        <button
          onClick={() => window.print()}
          disabled={qtdSelecionadas === 0}
          className="h-11 px-5 inline-flex items-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark disabled:opacity-50"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Salvar PDF
          {qtdSelecionadas > 0 && qtdSelecionadas < placas.length && (
            <span className="text-xs opacity-80">({qtdSelecionadas})</span>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {placas.map((p) => {
          const marcada = selecionadas.has(p.id);
          return (
            <div
              key={p.id}
              className={`placa-page bg-white mx-auto shadow border border-zinc-200 print:shadow-none print:border-0 relative transition-opacity ${
                marcada ? "" : "placa-skip opacity-30"
              }`}
              style={{ width: "150mm", height: "100mm" }}
            >
              {/* Checkbox flutuante (so na tela) */}
              <button
                type="button"
                onClick={() => toggle(p.id)}
                className="no-print absolute -top-2 -left-2 z-10"
                aria-label={marcada ? "Desmarcar" : "Marcar"}
                title={marcada ? "Desmarcar (não imprime)" : "Marcar (vai imprimir)"}
              >
                <span
                  className={`flex items-center justify-center w-7 h-7 rounded-md border-2 transition-all shadow-sm ${
                    marcada
                      ? "bg-cdl-blue border-cdl-blue text-white"
                      : "bg-white border-zinc-300 text-transparent hover:border-cdl-blue"
                  }`}
                >
                  <Check className="w-4 h-4" />
                </span>
              </button>

              <div
                className="w-full h-full flex flex-col items-center text-center"
                style={{ padding: "5mm 10mm" }}
              >
                {/* Topo: logo */}
                <div
                  className="flex items-center justify-center w-full"
                  style={{ height: "16mm" }}
                >
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt={tenantNome}
                      style={{
                        maxHeight: "16mm",
                        maxWidth: "55mm",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div
                      className="font-display font-bold text-navy-800"
                      style={{ fontSize: "16pt" }}
                    >
                      {tenantNome}
                    </div>
                  )}
                </div>

                {/* Linha decorativa superior */}
                <hr
                  style={{
                    width: "60mm",
                    height: "0.4mm",
                    background: "var(--gold-500)",
                    border: "none",
                    margin: "2mm 0 1mm 0",
                  }}
                />

                {/* Titulo do premio (sem ano agora) */}
                <p
                  className="font-mono text-zinc-700 tracking-widest"
                  style={{ fontSize: "10pt", letterSpacing: "0.18em" }}
                >
                  PRÊMIO MELHORES DO ANO
                </p>

                {/* Corpo do texto */}
                <p
                  className="text-zinc-800 mt-3"
                  style={{ fontSize: "11pt", lineHeight: 1.35 }}
                >
                  A {tenantNome} reconhece e homenageia
                </p>

                {/* Nome do vencedor — destaque */}
                <p
                  className="font-display-bold text-navy-800 leading-tight mt-1"
                  style={{ fontSize: "22pt", maxWidth: "130mm" }}
                >
                  {p.nome}
                </p>

                <p
                  className="text-zinc-800 mt-2"
                  style={{ fontSize: "11pt", lineHeight: 1.35 }}
                >
                  pela conquista do
                </p>

                <p
                  className="text-zinc-900 italic"
                  style={{ fontSize: "13pt", lineHeight: 1.3 }}
                >
                  1º Lugar na Categoria{" "}
                  <span className="font-display-bold not-italic">
                    {p.subcategoria}
                  </span>
                  ,
                </p>

                <p
                  className="text-zinc-700 mt-2"
                  style={{
                    fontSize: "10pt",
                    lineHeight: 1.35,
                    maxWidth: "130mm",
                  }}
                >
                  destacando sua relevância, credibilidade e contribuição para a
                  cidade de {cidade}.
                </p>

                {/* Empurra o rodape pra baixo */}
                <div className="flex-1" />

                {/* Bloco de assinatura — so se configurado em /admin/marca */}
                {temAssinatura && (
                  <div className="flex flex-col items-center" style={{ marginBottom: "1mm" }}>
                    <span
                      style={{
                        display: "block",
                        width: "50mm",
                        borderBottom: "0.3mm solid #1a1612",
                        marginBottom: "0.5mm",
                      }}
                    />
                    <p
                      className="font-display-bold text-navy-800"
                      style={{ fontSize: "10pt", lineHeight: 1.1 }}
                    >
                      {assinaturaNome}
                    </p>
                    {assinaturaCargo && (
                      <p
                        className="text-zinc-700"
                        style={{ fontSize: "8pt", lineHeight: 1.2 }}
                      >
                        {assinaturaCargo}
                      </p>
                    )}
                  </div>
                )}

                {/* Linha decorativa inferior */}
                <hr
                  style={{
                    width: "60mm",
                    height: "0.4mm",
                    background: "var(--gold-500)",
                    border: "none",
                    margin: "0 0 1.5mm 0",
                  }}
                />

                {/* Rodape: EDICAO ano */}
                <p
                  className="font-mono text-zinc-700 tracking-widest"
                  style={{ fontSize: "9pt", letterSpacing: "0.2em" }}
                >
                  EDIÇÃO {ano}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
