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

  // Ano editavel — default puxa de edicao.ano mas admin pode sobrescrever
  // (ex: imprimir placas da edicao 2025 em 2026 quando a entrega atrasa).
  const [anoExibido, setAnoExibido] = useState<number>(ano);

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
          print-color-adjust:exact forca browsers a imprimir cores de fundo
          (gradiente e ouro). .placa-skip esconde no print mas continua visivel
          na tela (com opacidade reduzida + checkbox desmarcado). */}
      <style>{`
        @media print {
          @page { size: 150mm 100mm; margin: 0; }
          html, body { background: #fff !important; }
          .placa-page {
            page-break-after: always;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .placa-page:last-child { page-break-after: auto; }
          .placa-skip { display: none !important; }
          .no-print { display: none !important; }
        }
        .placa-bg {
          background: radial-gradient(ellipse at 50% 40%, #fafafa 0%, #e2e2e2 100%);
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
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-xs text-muted inline-flex items-center gap-2">
            Edição
            <input
              type="number"
              min={2020}
              max={2100}
              value={anoExibido}
              onChange={(e) =>
                setAnoExibido(parseInt(e.target.value, 10) || ano)
              }
              className="h-9 w-20 rounded-md border border-border bg-white px-2 font-mono text-sm text-center"
            />
          </label>
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
      </div>

      <div className="flex flex-col gap-6">
        {placas.map((p) => {
          const marcada = selecionadas.has(p.id);
          return (
            <div
              key={p.id}
              className={`placa-page placa-bg mx-auto shadow print:shadow-none relative transition-opacity ${
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

              {/* Moldura dourada dupla — borda externa + interna */}
              <div
                style={{
                  position: "absolute",
                  inset: "2.5mm",
                  border: "0.3mm solid #c9a24a",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "3.5mm",
                  border: "0.15mm solid #c9a24a",
                  pointerEvents: "none",
                }}
              />

              <div
                className="w-full h-full flex flex-col items-center text-center relative"
                style={{ padding: "6mm 12mm" }}
              >
                {/* Topo: logo */}
                <div
                  className="flex items-center justify-center w-full"
                  style={{ height: "13mm" }}
                >
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt={tenantNome}
                      style={{
                        maxHeight: "13mm",
                        maxWidth: "45mm",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div
                      className="font-display font-bold text-navy-800"
                      style={{ fontSize: "14pt" }}
                    >
                      {tenantNome}
                    </div>
                  )}
                </div>

                {/* Titulo do premio */}
                <p
                  className="text-zinc-700"
                  style={{
                    fontSize: "9pt",
                    letterSpacing: "0.32em",
                    marginTop: "1.5mm",
                    fontWeight: 500,
                  }}
                >
                  PRÊMIO MELHORES DO ANO
                </p>

                {/* Diamante dourado decorativo */}
                <div
                  style={{
                    width: "2mm",
                    height: "2mm",
                    background: "#c9a24a",
                    transform: "rotate(45deg)",
                    margin: "1.5mm 0",
                  }}
                />

                {/* Corpo do texto — italic serif */}
                <p
                  className="font-display text-zinc-800 italic"
                  style={{ fontSize: "10pt", lineHeight: 1.35 }}
                >
                  A {tenantNome} reconhece e homenageia
                </p>

                {/* Nome do vencedor — grande, serif italic bold */}
                <p
                  className="font-display-bold text-navy-800 italic leading-tight"
                  style={{ fontSize: "22pt", maxWidth: "130mm", marginTop: "2mm" }}
                >
                  {p.nome}
                </p>

                {/* Linha "pela conquista do 1º Lugar na categoria" */}
                <p
                  className="font-display text-zinc-800 italic"
                  style={{ fontSize: "10pt", lineHeight: 1.35, marginTop: "2.5mm" }}
                >
                  pela conquista do{" "}
                  <span className="font-display-bold">1º Lugar</span> na categoria
                </p>

                {/* Subcategoria */}
                <p
                  className="font-display-bold text-navy-800 italic"
                  style={{ fontSize: "13pt", lineHeight: 1.2, marginTop: "1mm" }}
                >
                  {p.subcategoria}
                </p>

                {/* "destacando..." */}
                <p
                  className="font-display text-zinc-700 italic"
                  style={{
                    fontSize: "9pt",
                    lineHeight: 1.3,
                    maxWidth: "120mm",
                    marginTop: "1.5mm",
                  }}
                >
                  destacando sua relevância, credibilidade e contribuição para a
                  cidade de {cidade}.
                </p>

                {/* Empurra rodape pra baixo */}
                <div className="flex-1" />

                {/* Bloco assinatura: nome cursivo + linha curta + cargo */}
                {temAssinatura && (
                  <div className="flex flex-col items-center" style={{ marginBottom: "2mm" }}>
                    <p
                      className="text-navy-800"
                      style={{
                        fontFamily:
                          "var(--font-pinyon), 'Snell Roundhand', 'Brush Script MT', cursive",
                        fontStyle: "normal",
                        fontWeight: 400,
                        fontSize: "26pt",
                        lineHeight: 1,
                      }}
                    >
                      {assinaturaNome}
                    </p>
                    <span
                      style={{
                        display: "block",
                        width: "40mm",
                        height: "0.2mm",
                        background: "#3a3a3a",
                        marginTop: "0.5mm",
                      }}
                    />
                    {assinaturaCargo && (
                      <p
                        className="text-zinc-700"
                        style={{
                          fontSize: "6.5pt",
                          letterSpacing: "0.2em",
                          marginTop: "1mm",
                          fontWeight: 500,
                        }}
                      >
                        {assinaturaCargo.toUpperCase()}
                      </p>
                    )}
                  </div>
                )}

                {/* Rodape: "— EDIÇÃO 2025 —" com tracinhos dourados */}
                <div
                  className="flex items-center justify-center"
                  style={{ gap: "3mm" }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "10mm",
                      height: "0.3mm",
                      background: "#c9a24a",
                    }}
                  />
                  <span
                    className="text-zinc-700"
                    style={{
                      fontSize: "7.5pt",
                      letterSpacing: "0.32em",
                      fontWeight: 500,
                    }}
                  >
                    EDIÇÃO {anoExibido}
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      width: "10mm",
                      height: "0.3mm",
                      background: "#c9a24a",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
