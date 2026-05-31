"use client";

import { useMemo, useState } from "react";
import { Printer, Loader2, FileText, Pencil, Check } from "lucide-react";
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
  posicao = 1,
}: {
  vencedores: Vencedor[];
  branding: TenantBranding;
  posicao?: 1 | 2 | 3;
}) {
  const [variante, setVariante] = useState<Variante>("navy");
  const [signatario, setSignatario] = useState("Elison do Bomfim");
  const [cargo, setCargo] = useState(`Presidente · ${branding.nome}`);
  const [edicao, setEdicao] = useState("34ª edição");
  const [ano, setAno] = useState<number>(branding.ano);
  const [imprimindo, setImprimindo] = useState(false);
  // Por default todos selecionados. Admin desmarca os que NAO quer imprimir.
  const [selecionados, setSelecionados] = useState<Set<string>>(
    () => new Set(vencedores.map((v) => v.subcategoria_id))
  );

  function toggle(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function marcarTodos() {
    setSelecionados(new Set(vencedores.map((v) => v.subcategoria_id)));
  }
  function desmarcarTodos() {
    setSelecionados(new Set());
  }
  function apenasEste(id: string) {
    setSelecionados(new Set([id]));
  }

  const qtdSelecionados = selecionados.size;

  const Comp = VARIANTES[variante].Componente;
  const nomeOrgao = `Câmara de Dirigentes Lojistas · ${branding.cidade}`;
  const dominio = branding.dominio || "cdlaju.com.br";

  // Props compartilhadas de todos certs — so vencedor/categoria/numero variam.
  const propsBase: Omit<CertificadoProps, "vencedor" | "categoria" | "numero"> = useMemo(
    () => ({
      signatario,
      cargo,
      cidade: branding.cidade,
      ano,
      edicao,
      nomeOrgao,
      dominio,
      logoSrc: branding.logoUrl ?? "/cdl-logo.png",
      posicao,
    }),
    [signatario, cargo, branding.cidade, ano, edicao, nomeOrgao, dominio, branding.logoUrl, posicao]
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
        <div className="grid gap-3 md:grid-cols-4">
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
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-muted font-mono">
              Ano
            </span>
            <input
              type="number"
              min={2000}
              max={2100}
              value={ano}
              onChange={(e) => setAno(parseInt(e.target.value, 10) || branding.ano)}
              className="border border-cdl-blue/20 rounded-md px-3 py-2 text-sm bg-white font-mono"
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
                Imprimir {qtdSelecionados} de {vencedores.length}{" "}
                {vencedores.length === 1 ? "certificado" : "certificados"}
              </p>
              <p className="text-xs text-muted leading-snug mt-0.5">
                Use os <b>checkboxes</b> abaixo pra escolher só algumas
                pessoas. No diálogo de impressão: <b>Salvar como PDF</b>,
                papel <b>Carta paisagem</b>, margens <b>Nenhuma</b>,{" "}
                <b>Gráficos de fundo: ativado</b>.
              </p>
              <div className="mt-2 flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={marcarTodos}
                  disabled={qtdSelecionados === vencedores.length}
                  className="text-cdl-blue hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  Marcar todos
                </button>
                <button
                  type="button"
                  onClick={desmarcarTodos}
                  disabled={qtdSelecionados === 0}
                  className="text-muted hover:text-cdl-blue hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  Desmarcar todos
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={imprimir}
            disabled={imprimindo || qtdSelecionados === 0}
            className="inline-flex items-center gap-2 h-12 px-5 rounded-lg bg-cdl-blue text-white text-sm font-semibold hover:bg-cdl-blue-dark transition-colors disabled:opacity-50"
          >
            {imprimindo ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Printer className="w-5 h-5" />
            )}
            {imprimindo
              ? "preparando…"
              : qtdSelecionados === 1
                ? "Imprimir 1 certificado"
                : `Imprimir ${qtdSelecionados} certificados`}
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
                {lista.map((v) => {
                  const marcado = selecionados.has(v.subcategoria_id);
                  return (
                    <li
                      key={v.subcategoria_id}
                      className={`flex items-center gap-3 px-4 py-2 text-sm transition-opacity ${
                        marcado ? "" : "opacity-40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(v.subcategoria_id)}
                        aria-label={marcado ? "Desmarcar" : "Marcar"}
                        className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                          marcado
                            ? "bg-cdl-blue border-cdl-blue text-white"
                            : "bg-white border-cdl-blue/30 text-transparent hover:border-cdl-blue"
                        }`}
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-xs text-muted w-16 shrink-0">
                        {v.numero.split(" / ")[0]}
                      </span>
                      <span className="text-cdl-blue font-medium flex-1 min-w-0 truncate">
                        {v.vencedor}
                      </span>
                      <span className="text-muted text-xs italic flex-1 min-w-0 truncate text-right">
                        {v.categoria}
                      </span>
                      <button
                        type="button"
                        onClick={() => apenasEste(v.subcategoria_id)}
                        title="Imprimir só este (desmarca os outros)"
                        className="text-[10px] text-cdl-blue hover:underline shrink-0"
                      >
                        só este
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Stack escondido no screen — UM cert por pagina no print.
          Paginas com .cert-print-skip somem no print (desmarcadas). */}
      <div className="cert-print-stack" aria-hidden="true">
        {vencedores.map((v) => {
          const marcado = selecionados.has(v.subcategoria_id);
          return (
            <div
              key={v.subcategoria_id}
              className={`cert-print-page ${marcado ? "" : "cert-print-skip"}`}
            >
              <div className="cert-scaled">
                <Comp
                  {...propsBase}
                  vencedor={v.vencedor}
                  categoria={v.categoria}
                  numero={v.numero}
                />
              </div>
            </div>
          );
        })}
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
          .cert-print-page.cert-print-skip { display: none !important; }
          .cert-print-page > .cert-scaled {
            transform: scale(0.8);
            transform-origin: top left;
          }
        }
      `}</style>
    </div>
  );
}
