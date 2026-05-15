"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  CheckCircle2,
  ArrowLeft,
  CreditCard,
  QrCode,
  ShieldCheck,
  Lock,
  Loader2,
} from "lucide-react";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";
import Link from "next/link";
import { PRECOS } from "@/lib/creditos";

// Estima a faixa de votantes que o valor compra:
//   - Mais barato: R$ 0,20/votante (sem SPC, sem WhatsApp)
//   - Mais caro:   R$ 0,50/votante (SPC R$ 0,25 + OTP WhatsApp R$ 0,25)
// Arredonda pra dezena pra ficar legivel.
function faixaVotantes(centavos: number): string {
  const arredonda = (n: number) => Math.floor(n / 10) * 10;
  const custoMaximo = PRECOS.voto_spc + PRECOS.whatsapp_confirmacao;
  const min = arredonda(centavos / custoMaximo);       // mais caro = menos votantes
  const max = arredonda(centavos / PRECOS.voto_minimo); // mais barato = mais votantes
  const fmt = (n: number) => n.toLocaleString("pt-BR");
  return `${fmt(min)} a ${fmt(max)} votantes`;
}

const VALORES_SUGERIDOS = [
  { centavos: 50000, label: "R$ 500" },
  { centavos: 100000, label: "R$ 1.000" },
  { centavos: 250000, label: "R$ 2.500" },
  { centavos: 500000, label: "R$ 5.000" },
  { centavos: 1000000, label: "R$ 10.000" },
  { centavos: 2500000, label: "R$ 25.000" },
].map((v) => ({ ...v, subtitle: faixaVotantes(v.centavos) }));

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? "";

type Etapa = "valor" | "pagamento" | "pix" | "sucesso" | "erro";
type Aba = "cartao" | "pix";

type ResultadoPagamento = {
  status: string;
  status_detail: string | null;
  pagamento_id: string;
  qr_code: string | null;
  qr_code_base64: string | null;
};

// Customizacao do CardPayment Brick — cores da plataforma
const BRICK_VISUAL = {
  style: {
    theme: "default" as const,
    customVariables: {
      formBackgroundColor: "#ffffff",
      baseColor: "#0c2a5b",
      baseColorFirstVariant: "#1ea049",
      baseColorSecondVariant: "#0c2a5b",
      successColor: "#1ea049",
      errorColor: "#dc2626",
      textPrimaryColor: "#0c2a5b",
      textSecondaryColor: "#737373",
      inputBackgroundColor: "#ffffff",
      inputFocusedBoxShadow: "0 0 0 3px rgba(12, 42, 91, 0.15)",
      inputFocusedBorderWidth: "2px",
      inputBorderWidth: "1px",
      formInputsBorderRadius: "8px",
      borderRadiusSmall: "6px",
      borderRadiusMedium: "8px",
      borderRadiusLarge: "10px",
      buttonHeight: "48px",
      fontWeightSemiBold: "600",
      inputVerticalPadding: "12px",
      inputHorizontalPadding: "14px",
    },
  },
  hideFormTitle: true,
};

export function ComprarForm({
  tenantNome,
  emailDefault,
}: {
  tenantNome: string;
  emailDefault: string;
}) {
  const [etapa, setEtapa] = useState<Etapa>("valor");
  const [aba, setAba] = useState<Aba>("cartao");
  const [valorCentavos, setValorCentavos] = useState<number>(100000);
  const [valorCustomReais, setValorCustomReais] = useState("");
  const [email, setEmail] = useState(emailDefault);
  const [cpf, setCpf] = useState("");
  const [resultado, setResultado] = useState<ResultadoPagamento | null>(null);
  const [erroMsg, setErroMsg] = useState<string | null>(null);
  const [gerandoPix, setGerandoPix] = useState(false);

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

  function formatarCpf(input: string): string {
    const d = input.replace(/\D/g, "").slice(0, 11);
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
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

  async function gerarPix() {
    setErroMsg(null);
    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      setErroMsg("CPF inválido");
      return;
    }
    setGerandoPix(true);
    try {
      const res = await fetch("/api/creditos/comprar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor_centavos: valorCentavos,
          payment_method_id: "pix",
          payer: {
            email,
            identification: { type: "CPF", number: cpfDigits },
            first_name: tenantNome.split(" ")[0] ?? tenantNome,
            last_name: tenantNome.split(" ").slice(1).join(" ") || "Cliente",
          },
        }),
      });
      const json = (await res.json()) as
        | (ResultadoPagamento & { ok?: boolean })
        | { error?: string };
      if (!res.ok || "error" in json) {
        setErroMsg(("error" in json && json.error) || "Falha ao gerar Pix");
        return;
      }
      const r = json as ResultadoPagamento;
      setResultado(r);
      if (r.qr_code_base64) {
        setEtapa("pix");
      } else {
        setErroMsg("MP não retornou QR code");
      }
    } catch (e) {
      setErroMsg(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setGerandoPix(false);
    }
  }

  // ============== ETAPA 1 — escolher valor ==============
  if (etapa === "valor") {
    return (
      <div className="flex flex-col gap-5">
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

  // ============== ETAPA 2 — checkout integrado (cartao + pix) ==============
  if (etapa === "pagamento") {
    return (
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Coluna esquerda: forma de pagamento */}
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setEtapa("valor")}
            className="self-start text-sm text-cdl-blue hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar (mudar valor)
          </button>

          {/* Tabs custom */}
          <div className="flex border border-border rounded-lg overflow-hidden bg-zinc-50">
            <button
              type="button"
              onClick={() => {
                setAba("cartao");
                setErroMsg(null);
              }}
              className={`flex-1 py-3 px-4 text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors ${
                aba === "cartao"
                  ? "bg-white text-cdl-blue border-b-2 border-cdl-blue"
                  : "text-muted hover:text-cdl-blue"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Cartão
            </button>
            <button
              type="button"
              onClick={() => {
                setAba("pix");
                setErroMsg(null);
              }}
              className={`flex-1 py-3 px-4 text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors ${
                aba === "pix"
                  ? "bg-white text-cdl-blue border-b-2 border-cdl-blue"
                  : "text-muted hover:text-cdl-blue"
              }`}
            >
              <QrCode className="w-4 h-4" />
              Pix
            </button>
          </div>

          {/* Conteudo da aba */}
          {aba === "cartao" ? (
            <div className="bg-white rounded-lg border border-border p-4">
              <CardPayment
                initialization={{
                  amount: valorCentavos / 100,
                  payer: { email },
                }}
                customization={{
                  paymentMethods: { maxInstallments: 12 },
                  visual: BRICK_VISUAL,
                }}
                onSubmit={async (formData) => {
                  try {
                    const fd = formData as unknown as {
                      payment_method_id: string;
                      token: string;
                      installments: number;
                      issuer_id?: string;
                      payer?: {
                        email?: string;
                        identification?: {
                          type: string;
                          number: string;
                        };
                      };
                    };
                    const res = await fetch("/api/creditos/comprar", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        valor_centavos: valorCentavos,
                        payment_method_id: fd.payment_method_id,
                        token: fd.token,
                        installments: fd.installments,
                        issuer_id: fd.issuer_id ?? null,
                        payer: {
                          email: fd.payer?.email ?? email,
                          identification: fd.payer?.identification,
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
                    } else if (r.status === "rejected") {
                      setErroMsg("Cartão recusado. Tente outro método.");
                      setEtapa("erro");
                    } else {
                      setEtapa("sucesso");
                    }
                  } catch (e) {
                    setErroMsg(
                      e instanceof Error ? e.message : "Falha de rede"
                    );
                    setEtapa("erro");
                  }
                }}
                onError={(err) => {
                  console.error("MP Brick error:", err);
                  setErroMsg("Erro no formulário. Recarregue a página.");
                }}
              />
            </div>
          ) : (
            // Aba Pix
            <div className="bg-white rounded-lg border border-border p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3 p-3 bg-cdl-green/5 border border-cdl-green/20 rounded-md">
                <QrCode className="w-5 h-5 text-cdl-green-dark mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-cdl-blue">
                    Pix instantâneo
                  </p>
                  <p className="text-muted text-xs mt-0.5">
                    Geramos um QR code, você paga no app do banco e o saldo
                    cai em segundos.
                  </p>
                </div>
              </div>

              <label className="text-sm font-medium text-cdl-blue">
                CPF do titular
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={cpf}
                  onChange={(e) => setCpf(formatarCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="mt-1 w-full h-11 rounded-md border border-border bg-white px-3 font-mono"
                  maxLength={14}
                />
              </label>

              {erroMsg ? (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                  {erroMsg}
                </p>
              ) : null}

              <button
                type="button"
                onClick={gerarPix}
                disabled={gerandoPix}
                className="h-12 inline-flex items-center justify-center gap-2 rounded-md bg-cdl-green text-white font-medium hover:bg-cdl-green-dark disabled:opacity-50"
              >
                {gerandoPix ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4" />
                )}
                Gerar QR Code Pix
              </button>
            </div>
          )}

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted py-2">
            <span className="inline-flex items-center gap-1">
              <Lock className="w-3 h-3" />
              SSL 256 bits
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Processado pelo Mercado Pago
            </span>
          </div>
        </div>

        {/* Coluna direita: resumo do pedido (sticky) */}
        <aside className="lg:sticky lg:top-4 self-start">
          <div className="bg-cdl-blue/5 border border-cdl-blue/20 rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-cdl-blue/60 mb-3">
              Resumo
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Cliente</span>
                <span className="font-medium text-cdl-blue truncate ml-2">
                  {tenantNome}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Email</span>
                <span className="text-cdl-blue truncate ml-2 text-xs">
                  {email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Produto</span>
                <span className="text-cdl-blue text-xs">Recarga créditos</span>
              </div>
              <hr className="border-cdl-blue/15 my-2" />
              <div className="flex justify-between items-end">
                <span className="text-muted text-xs">Total</span>
                <span className="font-display text-2xl font-bold text-cdl-blue">
                  R${" "}
                  {(valorCentavos / 100).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted mt-3 leading-relaxed">
              Saldo creditado automaticamente após confirmação. Sem
              mensalidades — você paga só quando recarrega.
            </p>
          </div>
        </aside>
      </div>
    );
  }

  // ============== ETAPA 3 — Pix QR code ==============
  if (etapa === "pix" && resultado?.qr_code_base64) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-full max-w-md bg-white border-2 border-cdl-green/30 rounded-xl p-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-cdl-green-dark">
            <QrCode className="w-5 h-5" />
            <h3 className="font-display text-lg font-bold">
              Pague com Pix
            </h3>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${resultado.qr_code_base64}`}
            alt="QR Code Pix"
            className="w-56 h-56 rounded-lg"
          />

          <p className="text-sm text-muted text-center">
            Escaneie com o app do seu banco ou copie o código abaixo.
          </p>

          {resultado.qr_code ? (
            <div className="w-full">
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
                  className="h-10 px-3 inline-flex items-center gap-1 rounded-md bg-cdl-blue text-white text-sm hover:bg-cdl-blue-dark"
                  title="Copiar"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </button>
              </div>
            </div>
          ) : null}

          <p className="text-xs text-muted text-center">
            Valor:{" "}
            <strong className="text-cdl-blue">
              R${" "}
              {(valorCentavos / 100).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </strong>
          </p>
        </div>

        <Link
          href="/admin/creditos"
          className="h-11 px-6 inline-flex items-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark"
        >
          Voltar pro saldo
        </Link>
        <p className="text-xs text-muted text-center max-w-md">
          Pode fechar essa página. O saldo aparece automaticamente quando o
          Pix for confirmado pelo banco.
        </p>
      </div>
    );
  }

  // ============== ETAPA 4 — Cartao aprovado ==============
  if (etapa === "sucesso") {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
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

  // ============== ETAPA 5 — Erro ==============
  return (
    <div className="flex flex-col items-center gap-4 text-center py-6">
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
