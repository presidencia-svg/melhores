"use client";

import { useState, useEffect } from "react";
import { Copy, CheckCircle2, ArrowLeft } from "lucide-react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import Link from "next/link";

const VALORES_SUGERIDOS = [
  { centavos: 50000, label: "R$ 500", subtitle: "~830 votos SPC" },
  { centavos: 100000, label: "R$ 1.000", subtitle: "~1.660 votos SPC" },
  { centavos: 250000, label: "R$ 2.500", subtitle: "~4.150 votos SPC" },
  { centavos: 500000, label: "R$ 5.000", subtitle: "~8.300 votos SPC" },
  { centavos: 1000000, label: "R$ 10.000", subtitle: "~16.600 votos SPC" },
  { centavos: 2500000, label: "R$ 25.000", subtitle: "~41.600 votos SPC" },
];

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? "";

type Etapa = "valor" | "pagamento" | "pix" | "sucesso" | "erro";

type ResultadoPagamento = {
  status: string;
  status_detail: string | null;
  pagamento_id: string;
  qr_code: string | null;
  qr_code_base64: string | null;
};

export function ComprarForm({
  tenantNome,
  emailDefault,
}: {
  tenantNome: string;
  emailDefault: string;
}) {
  const [etapa, setEtapa] = useState<Etapa>("valor");
  const [valorCentavos, setValorCentavos] = useState<number>(100000);
  const [valorCustomReais, setValorCustomReais] = useState("");
  const [email, setEmail] = useState(emailDefault);
  const [resultado, setResultado] = useState<ResultadoPagamento | null>(null);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  useEffect(() => {
    if (PUBLIC_KEY) {
      initMercadoPago(PUBLIC_KEY, { locale: "pt-BR" });
    }
  }, []);

  function setCustom(input: string) {
    const onlyDigits = input.replace(/\D/g, "");
    setValorCustomReais(onlyDigits);
    if (onlyDigits) {
      setValorCentavos(parseInt(onlyDigits, 10) * 100);
    }
  }

  function avancarPraPagamento() {
    setErroMsg(null);
    if (valorCentavos < 500) {
      setErroMsg("Mínimo R$ 5,00");
      return;
    }
    if (!email || !email.includes("@")) {
      setErroMsg("Email inválido");
      return;
    }
    if (!PUBLIC_KEY) {
      setErroMsg(
        "Pagamento não configurado (NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ausente)."
      );
      return;
    }
    setEtapa("pagamento");
  }

  // ETAPA 1 — escolher valor
  if (etapa === "valor") {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-cdl-blue mb-2 block">
            Quanto você quer comprar?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {VALORES_SUGERIDOS.map((v) => (
              <button
                key={v.centavos}
                type="button"
                onClick={() => {
                  setValorCentavos(v.centavos);
                  setValorCustomReais("");
                }}
                className={`text-left p-3 rounded-lg border-2 transition-colors ${
                  valorCentavos === v.centavos && !valorCustomReais
                    ? "border-cdl-blue bg-cdl-blue/5"
                    : "border-border hover:border-cdl-blue/50"
                }`}
              >
                <div className="font-bold text-cdl-blue">{v.label}</div>
                <div className="text-xs text-muted">{v.subtitle}</div>
              </button>
            ))}
          </div>

          <div className="mt-3">
            <label className="text-xs text-muted block mb-1">
              Ou outro valor (em reais inteiros, sem centavos):
            </label>
            <div className="flex items-center gap-2">
              <span className="text-cdl-blue font-medium">R$</span>
              <input
                type="text"
                inputMode="numeric"
                value={valorCustomReais}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="0"
                className="flex-1 h-10 rounded-md border border-border bg-white px-3 font-mono"
              />
            </div>
          </div>
        </div>

        <label className="text-sm font-medium text-cdl-blue">
          Email do comprador (recebe nota fiscal)
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3"
          />
        </label>

        {erroMsg ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
            {erroMsg}
          </p>
        ) : null}

        <div className="text-sm text-muted bg-zinc-50 rounded-md p-3">
          <strong className="text-cdl-blue">{tenantNome}</strong> vai pagar{" "}
          <strong className="text-cdl-blue">
            R${" "}
            {(valorCentavos / 100).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </strong>{" "}
          em créditos. Pagamento processado direto aqui (você não sai do site).
        </div>

        <button
          type="button"
          onClick={avancarPraPagamento}
          disabled={valorCentavos < 500}
          className="h-12 inline-flex items-center justify-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark disabled:opacity-50"
        >
          Continuar para pagamento →
        </button>
      </div>
    );
  }

  // ETAPA 2 — Brick do MP (cartao + pix)
  if (etapa === "pagamento") {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setEtapa("valor")}
          className="self-start text-sm text-cdl-blue hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar (mudar valor)
        </button>

        <div className="text-sm text-muted bg-zinc-50 rounded-md p-3">
          Você vai pagar{" "}
          <strong className="text-cdl-blue">
            R${" "}
            {(valorCentavos / 100).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </strong>
          . Escolha cartão (até 12x) ou Pix.
        </div>

        <Payment
          initialization={{
            amount: valorCentavos / 100,
            payer: { email },
          }}
          customization={{
            paymentMethods: {
              creditCard: "all",
              debitCard: "all",
              bankTransfer: "all", // habilita Pix
              maxInstallments: 12,
            },
            visual: {
              style: { theme: "default" },
            },
          }}
          onSubmit={async (param) => {
            // O Brick chama isso quando o cliente confirma. param.formData
            // contem token (cartao) ou payment_method_id='pix'.
            try {
              const fd = param.formData as {
                payment_method_id: string;
                token?: string;
                installments?: number;
                issuer_id?: string;
                payer?: {
                  email?: string;
                  identification?: { type: string; number: string };
                  first_name?: string;
                  last_name?: string;
                };
              };
              const res = await fetch("/api/creditos/comprar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  valor_centavos: valorCentavos,
                  payment_method_id: fd.payment_method_id,
                  token: fd.token ?? null,
                  installments: fd.installments ?? null,
                  issuer_id: fd.issuer_id ?? null,
                  payer: {
                    email: fd.payer?.email ?? email,
                    identification: fd.payer?.identification,
                    first_name: fd.payer?.first_name,
                    last_name: fd.payer?.last_name,
                  },
                }),
              });
              const json = (await res.json()) as
                | (ResultadoPagamento & { ok?: boolean })
                | { error?: string };
              if (!res.ok || "error" in json) {
                setErroMsg(
                  ("error" in json && json.error) || "Falha no pagamento"
                );
                setEtapa("erro");
                return;
              }
              const r = json as ResultadoPagamento;
              setResultado(r);
              if (r.status === "approved") {
                setEtapa("sucesso");
              } else if (r.qr_code_base64) {
                setEtapa("pix");
              } else if (r.status === "rejected") {
                setErroMsg("Cartão recusado. Tente outro método.");
                setEtapa("erro");
              } else {
                setEtapa("sucesso");
              }
            } catch (e) {
              setErroMsg(e instanceof Error ? e.message : "Falha de rede");
              setEtapa("erro");
            }
          }}
          onError={(err) => {
            console.error("MP Brick error:", err);
            setErroMsg("Erro no formulário. Tente recarregar a página.");
          }}
        />
      </div>
    );
  }

  // ETAPA 3 — Pix QR code
  if (etapa === "pix" && resultado?.qr_code_base64) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h3 className="font-display text-lg font-bold text-cdl-blue">
          Pague com Pix em segundos
        </h3>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${resultado.qr_code_base64}`}
          alt="QR Code Pix"
          className="w-64 h-64 border border-border rounded-lg"
        />
        <p className="text-sm text-muted text-center max-w-md">
          Abra o app do seu banco, escaneie o QR ou copie o código abaixo.
          Saldo creditado em segundos após confirmação.
        </p>

        {resultado.qr_code ? (
          <div className="w-full">
            <label className="text-xs text-muted block mb-1">
              Pix Copia e Cola:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={resultado.qr_code}
                className="flex-1 h-10 rounded-md border border-border bg-zinc-50 px-3 font-mono text-xs"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(resultado.qr_code ?? "");
                }}
                className="h-10 px-3 inline-flex items-center gap-1 rounded-md border border-border text-sm hover:bg-zinc-50"
                title="Copiar"
              >
                <Copy className="w-4 h-4" />
                Copiar
              </button>
            </div>
          </div>
        ) : null}

        <Link
          href="/admin/creditos"
          className="mt-2 h-11 px-6 inline-flex items-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark"
        >
          Voltar pro saldo
        </Link>
        <p className="text-xs text-muted">
          Pode fechar essa página. O saldo aparece automaticamente quando o
          Pix for confirmado.
        </p>
      </div>
    );
  }

  // ETAPA 4 — Cartao aprovado / em analise
  if (etapa === "sucesso") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-cdl-green/15 text-cdl-green-dark flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="font-display text-2xl font-bold text-cdl-blue">
          {resultado?.status === "approved"
            ? "Pagamento aprovado!"
            : "Pagamento em análise"}
        </h3>
        <p className="text-sm text-muted max-w-md">
          {resultado?.status === "approved"
            ? "Saldo já foi creditado. Pode usar agora."
            : "Aguardando confirmação do Mercado Pago. Saldo aparece quando aprovado (até 30min)."}
        </p>
        <Link
          href="/admin/creditos"
          className="mt-2 h-11 px-6 inline-flex items-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark"
        >
          Ver meu saldo
        </Link>
      </div>
    );
  }

  // ETAPA 5 — Erro
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3 max-w-md">
        {erroMsg ?? "Erro desconhecido"}
      </p>
      <button
        type="button"
        onClick={() => {
          setErroMsg(null);
          setEtapa("pagamento");
        }}
        className="h-10 px-4 inline-flex items-center gap-2 rounded-md bg-cdl-blue text-white text-sm hover:bg-cdl-blue-dark"
      >
        Tentar novamente
      </button>
    </div>
  );
}
