"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2, XCircle } from "lucide-react";

type Resultado =
  | {
      ok: true;
      codigo: string;
      template: string;
      language: string;
      numero: string;
    }
  | {
      ok: false;
      codigo?: string;
      template?: string;
      language?: string;
      numero?: string;
      detalhe: string;
    };

function formatarTelefone(input: string): string {
  const d = input.replace(/\D/g, "").slice(0, 13);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 9)
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

export function TesteOtpForm() {
  const [tel, setTel] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  async function disparar() {
    const digits = tel.replace(/\D/g, "");
    if (digits.length < 10) {
      setResultado({ ok: false, detalhe: "Telefone incompleto" });
      return;
    }
    setCarregando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/admin/whatsapp/teste-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp: digits }),
      });
      const data = (await res.json()) as Resultado | { error: string };
      if ("error" in data) {
        setResultado({ ok: false, detalhe: data.error });
      } else {
        setResultado(data);
      }
    } catch (e) {
      setResultado({
        ok: false,
        detalhe: e instanceof Error ? e.message : "Falha de rede",
      });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm font-medium text-cdl-blue">
        WhatsApp pra receber
        <input
          type="tel"
          value={tel}
          onChange={(e) => setTel(formatarTelefone(e.target.value))}
          placeholder="(79) 99999-9999"
          disabled={carregando}
          className="mt-1 w-full h-11 rounded-md border border-border bg-white px-3 font-mono"
        />
        <span className="text-xs text-muted block mt-1">
          Inclui DDD. Apenas Brasil — o código adiciona 55 automaticamente.
        </span>
      </label>

      <button
        onClick={disparar}
        disabled={carregando || tel.replace(/\D/g, "").length < 10}
        className="h-12 inline-flex items-center justify-center gap-2 px-6 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark disabled:opacity-50"
      >
        {carregando ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        Disparar OTP de teste
      </button>

      {resultado?.ok && (
        <div className="rounded-lg border-2 border-cdl-green/30 bg-cdl-green/5 p-4">
          <div className="flex items-start gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-cdl-green-dark shrink-0 mt-0.5" />
            <div>
              <p className="font-display-bold text-cdl-green-dark">
                Mensagem enviada pra Meta com sucesso
              </p>
              <p className="text-xs text-muted mt-1">
                Confere agora se chegou no WhatsApp do número. Pode levar
                alguns segundos.
              </p>
            </div>
          </div>
          <dl className="text-xs grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono">
            <dt className="text-muted">Código:</dt>
            <dd className="font-bold text-cdl-blue">{resultado.codigo}</dd>
            <dt className="text-muted">Número:</dt>
            <dd>55{resultado.numero}</dd>
            <dt className="text-muted">Template:</dt>
            <dd>{resultado.template}</dd>
            <dt className="text-muted">Idioma:</dt>
            <dd>{resultado.language}</dd>
          </dl>
        </div>
      )}

      {resultado && !resultado.ok && (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
          <div className="flex items-start gap-2">
            <XCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-display-bold text-red-900">
                Falhou ao enviar
              </p>
              <p className="text-xs text-red-800 mt-1 leading-relaxed break-words">
                {resultado.detalhe}
              </p>
              {resultado.template && (
                <p className="text-[11px] text-red-700 mt-2 font-mono">
                  Template: {resultado.template} · Idioma:{" "}
                  {resultado.language ?? "?"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <details className="text-xs text-muted">
        <summary className="cursor-pointer hover:text-cdl-blue">
          Possíveis erros comuns
        </summary>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          <li>
            <strong>(#132001) Template name does not exist</strong> — o nome
            no env <code>META_TEMPLATE_OTP</code> não bate com nenhum template
            aprovado na Meta. Confere o nome exato no painel.
          </li>
          <li>
            <strong>(#131009) Parameter value is not valid</strong> — número
            de telefone sem DDI/DDD ou inválido.
          </li>
          <li>
            <strong>(#100) Invalid OAuth access token</strong> — token expirou
            ou está errado. Gera novo System User Token no Meta Business.
          </li>
          <li>
            <strong>(#131056) Pair rate exceeded</strong> — você já enviou pro
            mesmo número várias vezes em sequência. Aguarda 1h.
          </li>
          <li>
            <strong>Sem campo &ldquo;Recebido&rdquo;</strong> — o template OTP
            do tipo AUTHENTICATION exige aprovação da Meta. Se foi aprovado
            recentemente, pode levar minutos pra propagar.
          </li>
        </ul>
      </details>
    </div>
  );
}
