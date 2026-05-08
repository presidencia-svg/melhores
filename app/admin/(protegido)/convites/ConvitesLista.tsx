"use client";

import { useState } from "react";
import {
  Printer,
  Loader2,
  FileText,
  Pencil,
  Calendar,
  Type,
} from "lucide-react";
import type { TenantBranding } from "@/lib/tenant/branding";
import { VARIANTES, type Variante, type ConviteProps } from "./Variantes";

export type Vencedor = {
  subcategoria_id: string;
  vencedor: string;
  categoria: string;
  grupo: string;
};

const PREVIEW_SCALE = 0.5;

const TEXTO_FORMAL_DEFAULT =
  "a comparecer à Festa de Premiação e Jantar de Gala dos Melhores do Ano, ocasião em que será entregue a placa em inox de honra ao mérito, com superacabamento, em reconhecimento a essa conquista.";

const TEXTO_INCLUSOS_DEFAULT =
  "🏅 Placa de Honra · 🎶 Banda ao vivo · 🍽 Jantar completo · 🥂 Open bar";

export function ConvitesLista({
  vencedores,
  branding,
}: {
  vencedores: Vencedor[];
  branding: TenantBranding;
}) {
  const [variante, setVariante] = useState<Variante>("classico");

  // Dados do evento
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

  // Textos editaveis (defaults bem escritos, mas usuario pode reescrever)
  const [textoSupra, setTextoSupra] = useState("tem a honra de convidar");
  const [textoSubcat, setTextoSubcat] = useState(
    "eleito(a) o(a) Melhor do Ano em"
  );
  const [textoFormal, setTextoFormal] = useState(TEXTO_FORMAL_DEFAULT);
  const [textoInclusos, setTextoInclusos] = useState(TEXTO_INCLUSOS_DEFAULT);
  const [textoValorObs, setTextoValorObs] = useState(
    "(placa de premiação + festa inclusos)"
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

  const Componente = VARIANTES[variante].Componente;

  const dadosCompartilhados: Omit<
    ConviteProps,
    "nomeVencedor" | "categoria" | "grupo"
  > = {
    branding,
    dataFesta,
    diaSemana,
    horario,
    local,
    enderecoLocal,
    valorMesa,
    pessoasPorMesa,
    dataLimite,
    telefoneContato,
    signatario,
    cargoSignatario,
    textoSupra,
    textoSubcat,
    textoFormal,
    textoInclusos,
    textoValorObs,
  };

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

      {/* Form: Dados do evento */}
      <div className="rounded-xl border border-cdl-blue/15 bg-cream-100 p-4 print:hidden">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-cdl-blue" />
          <p className="text-sm font-semibold text-cdl-blue">
            Dados do evento
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Campo
            label="Data da festa"
            value={dataFesta}
            onChange={setDataFesta}
          />
          <Campo
            label="Dia da semana"
            value={diaSemana}
            onChange={setDiaSemana}
          />
          <Campo label="Horário" value={horario} onChange={setHorario} />
          <Campo label="Local (nome)" value={local} onChange={setLocal} />
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

      {/* Form: Textos do convite (editaveis) */}
      <div className="rounded-xl border border-cdl-blue/15 bg-cream-100 p-4 print:hidden">
        <div className="flex items-center gap-2 mb-3">
          <Type className="w-4 h-4 text-cdl-blue" />
          <p className="text-sm font-semibold text-cdl-blue">
            Textos do convite (edite se quiser mudar)
          </p>
        </div>
        <div className="grid gap-3">
          <Campo
            label="Frase acima do nome"
            value={textoSupra}
            onChange={setTextoSupra}
            full
          />
          <Campo
            label="Frase acima da categoria"
            value={textoSubcat}
            onChange={setTextoSubcat}
            full
          />
          <CampoTextarea
            label="Texto formal do convite"
            value={textoFormal}
            onChange={setTextoFormal}
          />
          <Campo
            label="Linha de inclusos"
            value={textoInclusos}
            onChange={setTextoInclusos}
            full
          />
          <Campo
            label="Observação abaixo do valor"
            value={textoValorObs}
            onChange={setTextoValorObs}
            full
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setTextoSupra("tem a honra de convidar");
              setTextoSubcat("eleito(a) o(a) Melhor do Ano em");
              setTextoFormal(TEXTO_FORMAL_DEFAULT);
              setTextoInclusos(TEXTO_INCLUSOS_DEFAULT);
              setTextoValorObs("(placa de premiação + festa inclusos)");
            }}
            className="text-xs text-cdl-blue hover:underline inline-flex items-center gap-1"
          >
            <Pencil className="w-3 h-3" />
            Restaurar textos padrão
          </button>
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
                <b>A4 retrato</b>, margens <b>Nenhuma</b>,{" "}
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

      {/* Preview */}
      <div className="space-y-4 print:space-y-0">
        <p className="text-sm text-muted print:hidden">
          Pré-visualização do modelo{" "}
          <b className="text-cdl-blue">{VARIANTES[variante].nome}</b> (escala
          50%) — ao imprimir, cada convite ocupa 1 página A4 retrato.
        </p>
        {vencedores.map((v) => (
          <div
            key={v.subcategoria_id}
            className="convite-page bg-zinc-100 rounded-lg p-4 print:p-0 print:bg-transparent print:rounded-none print:break-after-page"
          >
            <div
              className="convite-preview-wrapper origin-top-left mx-auto"
              style={{
                width: `${210 * PREVIEW_SCALE}mm`,
                height: `${297 * PREVIEW_SCALE}mm`,
              }}
            >
              <div
                className="convite-preview-inner bg-white shadow-sm print:shadow-none"
                style={{
                  transform: `scale(${PREVIEW_SCALE})`,
                  transformOrigin: "top left",
                  width: "210mm",
                  height: "297mm",
                }}
              >
                <Componente
                  {...dadosCompartilhados}
                  nomeVencedor={v.vencedor}
                  categoria={v.categoria}
                  grupo={v.grupo}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: white;
          }
          /* Override inline scale: na impressao volta pra tamanho real A4 */
          .convite-preview-wrapper {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
          }
          .convite-preview-inner {
            transform: none !important;
            width: 210mm !important;
            height: 297mm !important;
            box-shadow: none !important;
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

function CampoTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-muted font-mono">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="border border-cdl-blue/20 rounded-md px-3 py-2 text-sm bg-white resize-y"
      />
    </label>
  );
}
