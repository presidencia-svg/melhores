"use client";

import { Printer } from "lucide-react";

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
}: {
  placas: PlacaItem[];
  ano: number;
  tenantNome: string;
  cidade: string;
  logoUrl: string | null;
}) {
  return (
    <div className="space-y-6">
      {/* CSS de impressao: pagina 150×100mm sem margens, uma placa por pagina */}
      <style>{`
        @media print {
          @page { size: 150mm 100mm; margin: 0; }
          html, body { background: #fff !important; }
          .placa-page { page-break-after: always; }
          .placa-page:last-child { page-break-after: auto; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex items-center justify-between gap-4 flex-wrap no-print">
        <p className="text-sm text-muted">
          <strong className="text-cdl-blue">{placas.length}</strong>{" "}
          {placas.length === 1 ? "placa" : "placas"} no total.
        </p>
        <button
          onClick={() => window.print()}
          className="h-11 px-5 inline-flex items-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Salvar PDF
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {placas.map((p) => (
          <div
            key={p.id}
            className="placa-page bg-white mx-auto shadow border border-zinc-200 print:shadow-none print:border-0"
            style={{ width: "150mm", height: "100mm" }}
          >
            <div
              className="w-full h-full flex flex-col items-center text-center"
              style={{ padding: "6mm 10mm" }}
            >
              {/* Topo: logo */}
              <div
                className="flex items-center justify-center w-full"
                style={{ height: "14mm" }}
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={tenantNome}
                    style={{
                      maxHeight: "14mm",
                      maxWidth: "50mm",
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
                className="font-mono text-zinc-700 tracking-widest mt-1"
                style={{ fontSize: "8pt", letterSpacing: "0.15em" }}
              >
                PRÊMIO MELHORES DO ANO {ano}
              </p>

              {/* Corpo do texto */}
              <p
                className="text-zinc-800 mt-3"
                style={{ fontSize: "9pt", lineHeight: 1.35 }}
              >
                A {tenantNome} reconhece e homenageia
              </p>

              {/* Nome do vencedor — destaque */}
              <p
                className="font-display-bold text-navy-800 leading-tight mt-1"
                style={{ fontSize: "18pt", maxWidth: "130mm" }}
              >
                {p.nome}
              </p>

              <p
                className="text-zinc-800 mt-2"
                style={{ fontSize: "9pt", lineHeight: 1.35 }}
              >
                pela conquista do
              </p>

              <p
                className="text-zinc-900 italic"
                style={{ fontSize: "10pt", lineHeight: 1.3 }}
              >
                1º Lugar na Categoria{" "}
                <span className="font-display-bold not-italic">
                  {p.subcategoria}
                </span>
                ,
              </p>

              <p
                className="text-zinc-700 mt-2"
                style={{ fontSize: "8pt", lineHeight: 1.35, maxWidth: "130mm" }}
              >
                destacando sua relevância, credibilidade e contribuição para a
                cidade de {cidade}.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
