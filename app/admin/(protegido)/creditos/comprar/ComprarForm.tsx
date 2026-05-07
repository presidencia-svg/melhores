"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

const VALORES_SUGERIDOS = [
  { centavos: 50000, label: "R$ 500", subtitle: "~830 votos SPC" },
  { centavos: 100000, label: "R$ 1.000", subtitle: "~1.660 votos SPC" },
  { centavos: 250000, label: "R$ 2.500", subtitle: "~4.150 votos SPC" },
  { centavos: 500000, label: "R$ 5.000", subtitle: "~8.300 votos SPC" },
  { centavos: 1000000, label: "R$ 10.000", subtitle: "~16.600 votos SPC" },
  { centavos: 2500000, label: "R$ 25.000", subtitle: "~41.600 votos SPC" },
];

export function ComprarForm({
  tenantNome,
  emailDefault,
}: {
  tenantNome: string;
  emailDefault: string;
}) {
  const [valorCentavos, setValorCentavos] = useState<number>(100000);
  const [valorCustomReais, setValorCustomReais] = useState("");
  const [email, setEmail] = useState(emailDefault);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function setCustom(input: string) {
    const onlyDigits = input.replace(/\D/g, "");
    setValorCustomReais(onlyDigits);
    if (onlyDigits) {
      setValorCentavos(parseInt(onlyDigits, 10) * 100);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (valorCentavos < 500) {
      setErro("Mínimo R$ 5,00");
      return;
    }
    if (!email || !email.includes("@")) {
      setErro("Email inválido");
      return;
    }
    setCarregando(true);
    try {
      const res = await fetch("/api/creditos/comprar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor_centavos: valorCentavos, email }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        pay_url?: string;
      };
      if (!res.ok || !json.pay_url) {
        setErro(json.error ?? "Falha ao iniciar pagamento");
        return;
      }
      // Redireciona pra checkout do Mercado Pago
      window.location.href = json.pay_url;
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede");
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
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
              disabled={carregando}
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
              disabled={carregando}
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
          disabled={carregando}
        />
      </label>

      {erro ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {erro}
        </p>
      ) : null}

      <div className="text-sm text-muted bg-zinc-50 rounded-md p-3">
        <strong className="text-cdl-blue">{tenantNome}</strong> vai pagar{" "}
        <strong className="text-cdl-blue">
          R$ {(valorCentavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </strong>{" "}
        em créditos. Após confirmar pagamento, saldo é adicionado em segundos.
      </div>

      <button
        type="submit"
        disabled={carregando || valorCentavos < 500}
        className="h-12 inline-flex items-center justify-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark disabled:opacity-50"
      >
        {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Continuar pra Mercado Pago →
      </button>
    </form>
  );
}
