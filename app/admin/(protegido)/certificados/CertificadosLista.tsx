"use client";

import { useMemo, useState } from "react";
import { Printer, Loader2, FileText, Pencil } from "lucide-react";
import type { TenantBranding } from "@/lib/tenant/branding";
import {
  CERT_W,
  VARIANTES,
  type Variante,
  type CertificadoProps,
} from "./Variantes";

export type Vencedor = {
  subcategoria_id: string;
  vencedor: string;
  categoria: string;
  grupo: string; // categoria pai
  numero: string;
};

const PREVIEW_SCALE = 0.5;

export function CertificadosLista({
  vencedores,
  branding,
}: {
  vencedores: Vencedor[];
  branding: TenantBranding;
}) {
  const [variante, setVariante] = useState<Variante>("navy");
  const [signatario, setSignatario] = useState("Elison do Bomfim");
  const [cargo, setCargo] = useState(`Presidente · ${branding.nome}`);
  const [edicao, setEdicao] = useState("34ª edição");
  const [imprimindo, setImprimindo] = useState(false);

  const Comp = VARIANTES[variante].Componente;
  const nomeOrgao = `Câmara de Dirigentes Lojistas · ${branding.cidade}`;
  const dominio = branding.dominio || "cdlaju.com.br";

  // Props compartilhadas de todos certs — so vencedor/categoria/numero variam.
  const propsBase: Omit<CertificadoProps, "vencedor" | "categoria" | "numero"> = useMemo(
    () => ({
      signatario,
      cargo,
      cidade: branding.cidade,
      ano: branding.ano,
      edicao,
      nomeOrgao,
      dominio,
    }),
    [signatario, cargo, branding.cidade, branding.ano, edicao, nomeOrgao, dominio]
  );

  // Agrupa pra mostrar lista de vencedores ordenada por categoria pai.
  const porGrupo = useMemo(() => {
    const m = new Map<string, Vencedor[]>();
    for (const v of vencedores) {
      if (!m.has(v.grupo)) m.set(v.grupo, []);
      m.get(v.grupo)!.push(v);
    }
    return Array.from(m.entries()).sort(([a], [b]) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [vencedores]);

  function imprimir() {
    setImprimindo(true);
    // Pequena espera pra garantir que o React commitou todos certs no DOM.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
        // Reset apos voltar do dialogo de print (browser nao avisa).
        setTimeout(() => setImprimindo(false), 1500);
      });
    });
  }

  const primeiro = vencedores[0];

  return (
    <div className="space-y-6">
      {/* TABS de variante */}
      <div className="flex flex-wrap gap-2 print:hidden">
        {(Object.keys(VARIANTES) as Variante[]).map((v) => {
          const ativo = v === variante;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setVariante(v)}
              className={`px-4 py-2 rounded-md text-sm font-medium tracking-wide transition-colors border ${
                ativo
                  ? "bg-cdl-blue text-white border-cdl-blue"
                  : "bg-cream-100 text-cdl-blue border-cdl-blue/20 hover:bg-cdl-blue/5"
              }`}
            >
              {VARIANTES[v].nome}
            </button>
          );
        })}
      </div>

      {/* Inputs de signatario / cargo / edicao */}
      <div className="rounded-xl border border-cdl-blue/15 bg-cream-100 p-4 print:hidden">
        <div className="flex items-center gap-2 mb-3">
          <Pencil className="w-4 h-4 text-cdl-blue" />
          <p className="text-sm font-semibold text-cdl-blue">
            Dados que aparecem em todos os certificados
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-muted font-mono">
              Signatário
            </span>
            <input
              type="text"
              value={signatario}
              onChange={(e) => setSignatario(e.target.value)}
              className="border border-cdl-blue/20 rounded-md px-3 py-2 text-sm bg-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-muted font-mono">
              Cargo
            </span>
            <input
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              className="border border-cdl-blue/20 rounded-md px-3 py-2 text-sm bg-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-muted font-mono">
              Edição
            </span>
            <input
              type="text"
              value={edicao}
              onChange={(e) => setEdicao(e.target.value)}
              className="border border-cdl-blue/20 rounded-md px-3 py-2 text-sm bg-white"
            />
          </label>
        </div>
      </div>

      {/* CTA grande de imprimir */}
      <div className="rounded-xl border border-cdl-yellow-dark/40 bg-gradient-to-br from-cream-100 to-cream-200 p-5 print:hidden">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-cdl-yellow text-cdl-blue flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="font-display-bold text-cdl-blue text-lg leading-tight">
                Imprimir 1 PDF com {vencedores.length}{" "}
                {vencedores.length === 1 ? "certificado" : "certificados"}
              </p>
              <p className="text-xs text-muted leading-snug mt-0.5">
                No diálogo de impressão escolha <b>Salvar como PDF</b>, papel{" "}
                <b>Carta paisagem</b>, margens <b>Nenhuma</b> e{" "}
                <b>Gráficos de fundo: ativado</b>. Texto e ornamentos saem
                vetoriais.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={imprimir}
            disabled={imprimindo}
            className="inline-flex items-center gap-2 h-12 px-5 rounded-lg bg-cdl-blue text-white text-sm font-semibold hover:bg-cdl-blue-dark transition-colors disabled:opacity-50"
          >
            {imprimindo ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Printer className="w-5 h-5" />
            )}
            {imprimindo ? "preparando…" : "Imprimir / Salvar PDF"}
          </button>
        </div>
      </div>

      {/* PREVIEW do certificado escolhido com primeiro vencedor */}
      {primeiro && (
        <div className="print:hidden">
          <p className="text-xs uppercase tracking-wider text-muted font-mono mb-2">
            Pré-visualização · {VARIANTES[variante].nome} · primeiro vencedor
          </p>
          <div
            className="bg-white rounded-md shadow-lg overflow-hidden border border-cdl-blue/10"
            style={{
              width: CERT_W * PREVIEW_SCALE,
              height: 1020 * PREVIEW_SCALE,
            }}
          >
            <div
              style={{
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: "top left",
              }}
            >
              <Comp
                {...propsBase}
                vencedor={primeiro.vencedor}
                categoria={primeiro.categoria}
                numero={primeiro.numero}
              />
            </div>
          </div>
        </div>
      )}

      {/* LISTA de quem aparece em cada pagina (verificacao) */}
      <div className="print:hidden">
        <p className="text-xs uppercase tracking-wider text-muted font-mono mb-2">
          Vencedores que serão impressos · {vencedores.length} páginas
        </p>
        <div className="rounded-xl border border-cdl-blue/15 bg-white">
          {porGrupo.map(([grupo, lista]) => (
            <div key={grupo} className="border-b last:border-b-0 border-cdl-blue/10">
              <div className="px-4 py-2 bg-cream-100 text-xs uppercase tracking-wider text-cdl-green font-mono font-semibold">
                {grupo} · {lista.length}
              </div>
              <ul className="divide-y divide-cdl-blue/5">
                {lista.map((v) => (
                  <li
                    key={v.subcategoria_id}
                    className="flex items-center gap-3 px-4 py-2 text-sm"
                  >
                    <span className="font-mono text-xs text-muted w-20 shrink-0">
                      {v.numero.split(" / ")[0]}
                    </span>
                    <span className="text-cdl-blue font-medium flex-1 min-w-0 truncate">
                      {v.vencedor}
                    </span>
                    <span className="text-muted text-xs italic flex-1 min-w-0 truncate text-right">
                      {v.categoria}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Stack escondido no screen — UM cert por pagina no print */}
      <div className="cert-print-stack" aria-hidden="true">
        {vencedores.map((v) => (
          <div key={v.subcategoria_id} className="cert-print-page">
            <div className="cert-scaled">
              <Comp
                {...propsBase}
                vencedor={v.vencedor}
                categoria={v.categoria}
                numero={v.numero}
              />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .cert-print-stack { display: none; }
        @media print {
          @page { size: 11in 8.5in; margin: 0; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .cert-print-stack { display: block; }
          .cert-print-page {
            width: 11in;
            height: 8.5in;
            overflow: hidden;
            page-break-after: always;
            break-after: page;
          }
          .cert-print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .cert-print-page > .cert-scaled {
            transform: scale(0.8);
            transform-origin: top left;
          }
        }
      `}</style>
    </div>
  );
}
