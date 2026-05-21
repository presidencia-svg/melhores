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
  logoUrl,
}: {
  placas: PlacaItem[];
  ano: number;
  tenantNome: string;
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
              className="w-full h-full flex flex-col items-center justify-between text-center"
              style={{ padding: "8mm 10mm" }}
            >
              {/* Topo: logo */}
              <div className="flex items-center justify-center" style={{ height: "20mm" }}>
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={tenantNome}
                    style={{ maxHeight: "20mm", maxWidth: "60mm", objectFit: "contain" }}
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

              {/* Centro: nome + subcategoria */}
              <div className="flex flex-col items-center gap-1">
                <p
                  className="font-display-bold text-navy-800 leading-tight"
                  style={{ fontSize: "20pt", maxWidth: "130mm" }}
                >
                  {p.nome}
                </p>
                <p
                  className="text-zinc-700 italic"
                  style={{ fontSize: "11pt" }}
                >
                  Melhor {p.subcategoria.toLowerCase()}
                </p>
              </div>

              {/* Rodape: ano */}
              <div
                className="font-mono text-zinc-500 tracking-widest"
                style={{ fontSize: "9pt" }}
              >
                EDIÇÃO {ano}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
