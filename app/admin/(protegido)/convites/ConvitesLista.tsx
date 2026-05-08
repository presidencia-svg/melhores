"use client";

import { useState } from "react";
import { Printer, Loader2, FileText, Pencil } from "lucide-react";
import type { TenantBranding } from "@/lib/tenant/branding";
import { ConviteCard } from "./ConviteCard";

export type Vencedor = {
  subcategoria_id: string;
  vencedor: string;
  categoria: string;
  grupo: string;
};

const PREVIEW_SCALE = 0.5;

export function ConvitesLista({
  vencedores,
  branding,
}: {
  vencedores: Vencedor[];
  branding: TenantBranding;
}) {
  // Dados editaveis do evento (defaults: dia 28/05, R$ 1.000 mesa de 2)
  const [dataFesta, setDataFesta] = useState("28 de maio de 2026");
  const [diaSemana, setDiaSemana] = useState("quarta-feira");
  const [horario, setHorario] = useState("20h");
  const [local, setLocal] = useState("[Local da festa]");
  const [enderecoLocal, setEnderecoLocal] = useState("[Endereço completo]");
  const [valorMesa, setValorMesa] = useState("R$ 1.000,00");
  const [pessoasPorMesa, setPessoasPorMesa] = useState("2 pessoas");
  const [dataLimite, setDataLimite] = useState("20 de maio de 2026");
  const [telefoneContato, setTelefoneContato] = useState("(79) 0000-0000");
  const [signatario, setSignatario] = useState("Elison do Bomfim");
  const [cargoSignatario, setCargoSignatario] = useState(
    `Presidente · ${branding.nome}`
  );
  const [imprimindo, setImprimindo] = useState(false);

  function imprimir() {
    setImprimindo(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
        setTimeout(() => setImprimindo(false), 1500);
      });
    });
  }

  return (
    <div className="space-y-6">
      {/* Form de dados do evento */}
      <div className="rounded-xl border border-cdl-blue/15 bg-cream-100 p-4 print:hidden">
        <div className="flex items-center gap-2 mb-3">
          <Pencil className="w-4 h-4 text-cdl-blue" />
          <p className="text-sm font-semibold text-cdl-blue">
            Dados do evento (aparecem em todos os convites)
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Campo label="Data da festa" value={dataFesta} onChange={setDataFesta} />
          <Campo
            label="Dia da semana"
            value={diaSemana}
            onChange={setDiaSemana}
          />
          <Campo label="Horário" value={horario} onChange={setHorario} />
          <Campo
            label="Local (nome)"
            value={local}
            onChange={setLocal}
          />
          <Campo
            label="Endereço completo"
            value={enderecoLocal}
            onChange={setEnderecoLocal}
            full
          />
          <Campo
            label="Valor da mesa"
            value={valorMesa}
            onChange={setValorMesa}
          />
          <Campo
            label="Pessoas por mesa"
            value={pessoasPorMesa}
            onChange={setPessoasPorMesa}
          />
          <Campo
            label="Data limite pra confirmar"
            value={dataLimite}
            onChange={setDataLimite}
          />
          <Campo
            label="Telefone de contato"
            value={telefoneContato}
            onChange={setTelefoneContato}
          />
          <Campo
            label="Signatário"
            value={signatario}
            onChange={setSignatario}
          />
          <Campo
            label="Cargo do signatário"
            value={cargoSignatario}
            onChange={setCargoSignatario}
            full
          />
        </div>
      </div>

      {/* CTA Imprimir */}
      <div className="rounded-xl border border-cdl-yellow-dark/40 bg-gradient-to-br from-cream-100 to-cream-200 p-5 print:hidden">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-cdl-yellow text-cdl-blue flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="font-display-bold text-cdl-blue text-lg leading-tight">
                Imprimir 1 PDF com {vencedores.length}{" "}
                {vencedores.length === 1 ? "convite" : "convites"}
              </p>
              <p className="text-xs text-muted leading-snug mt-0.5">
                No diálogo de impressão escolha <b>Salvar como PDF</b>, papel{" "}
                <b>A4 retrato</b>, margens <b>Nenhuma</b> e{" "}
                <b>Gráficos de fundo: ativado</b>.
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
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Preview da lista (escala reduzida na tela, full size no print) */}
      <div className="space-y-4 print:space-y-0">
        <p className="text-sm text-muted print:hidden">
          Pré-visualização (escala 50%) — ao imprimir, cada convite ocupa 1
          página A4 retrato.
        </p>
        {vencedores.map((v) => (
          <div
            key={v.subcategoria_id}
            className="bg-zinc-100 rounded-lg p-4 print:p-0 print:bg-transparent print:rounded-none print:break-after-page"
          >
            <div
              className="origin-top-left mx-auto print:scale-100 print:origin-top-left"
              style={{
                width: `${210 * PREVIEW_SCALE}mm`,
                height: `${297 * PREVIEW_SCALE}mm`,
              }}
            >
              <div
                className="bg-white shadow-sm print:shadow-none print:transform-none"
                style={{
                  transform: `scale(${PREVIEW_SCALE})`,
                  transformOrigin: "top left",
                  width: "210mm",
                  height: "297mm",
                }}
              >
                <ConviteCard
                  branding={branding}
                  nomeVencedor={v.vencedor}
                  categoria={v.categoria}
                  grupo={v.grupo}
                  dataFesta={dataFesta}
                  diaSemana={diaSemana}
                  horario={horario}
                  local={local}
                  enderecoLocal={enderecoLocal}
                  valorMesa={valorMesa}
                  pessoasPorMesa={pessoasPorMesa}
                  dataLimite={dataLimite}
                  telefoneContato={telefoneContato}
                  signatario={signatario}
                  cargoSignatario={cargoSignatario}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Estilos de impressao — A4 sem margens, 1 convite por pagina */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  full = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "md:col-span-2" : ""}`}>
      <span className="text-xs uppercase tracking-wider text-muted font-mono">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-cdl-blue/20 rounded-md px-3 py-2 text-sm bg-white"
      />
    </label>
  );
}
