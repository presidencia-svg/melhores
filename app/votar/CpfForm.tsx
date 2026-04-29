"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCpf, isValidCpf, onlyDigits } from "@/lib/cpf";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { isPrivateMode } from "@/lib/private-mode";
import { Turnstile } from "@/components/voto/Turnstile";

type Etapa = "cpf" | "nome";

export function CpfForm() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("cpf");
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");
  const [aceitou, setAceitou] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  function handleCpfChange(value: string) {
    const digits = onlyDigits(value).slice(0, 11);
    setCpf(digits.length > 0 ? formatCpf(digits) : "");
    if (error) setError(undefined);
  }

  async function chamarIdentificar(comNome: boolean) {
    const numeros = onlyDigits(cpf);
    const [fingerprint, privateMode] = await Promise.all([
      getDeviceFingerprint().catch(() => null),
      isPrivateMode().catch(() => false),
    ]);
    const body: Record<string, unknown> = {
      cpf: numeros,
      fingerprint,
      privateMode,
      turnstileToken,
    };
    if (comNome) body.nome = nome.trim();

    const res = await fetch("/api/identificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { res, data: await res.json() };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);

    const numeros = onlyDigits(cpf);
    if (!isValidCpf(numeros)) {
      setError("CPF inválido. Confira os números.");
      return;
    }

    if (!aceitou) {
      setError("Você precisa aceitar os Termos e a Política de Privacidade.");
      return;
    }

    if (turnstileRequired && !turnstileToken) {
      setError("Aguarde a verificação anti-robô concluir.");
      return;
    }

    if (etapa === "nome" && nome.trim().length < 2) {
      setError("Informe seu nome.");
      return;
    }

    setLoading(true);
    try {
      const { res, data } = await chamarIdentificar(etapa === "nome");
      if (!res.ok) {
        setError(data.error ?? "Não foi possível continuar. Tente novamente.");
        if (typeof window !== "undefined" && window.__turnstileReset) {
          window.__turnstileReset();
          setTurnstileToken(null);
        }
        return;
      }

      // CPF ja existe + whatsapp_validado → fluxo de retorno
      if (data.retorno) {
        router.push("/votar/retornar");
        return;
      }

      // CPF ja existe mas WhatsApp nao foi validado → completa o cadastro
      if (data.completarCadastro) {
        router.push("/votar/completar");
        return;
      }

      // Sem SPC e sem nome → revela campo de nome pra usuario preencher
      if (data.needName) {
        setEtapa("nome");
        // reseta turnstile pra proxima chamada com nome
        if (typeof window !== "undefined" && window.__turnstileReset) {
          window.__turnstileReset();
          setTurnstileToken(null);
        }
        return;
      }

      // Pre-cadastro salvo (SPC trouxe nome OU usuario digitou nome) → selfie
      router.push("/votar/selfie");
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="CPF"
        name="cpf"
        inputMode="numeric"
        placeholder="000.000.000-00"
        value={cpf}
        onChange={(e) => handleCpfChange(e.target.value)}
        autoComplete="off"
        autoFocus={etapa === "cpf"}
        maxLength={14}
        disabled={etapa === "nome"}
      />

      {etapa === "nome" && (
        <>
          <p className="text-xs text-muted -mt-1">
            Não conseguimos validar seu CPF na base oficial. Informe seu nome
            completo pra continuar.
          </p>
          <Input
            label="Nome completo"
            name="nome"
            placeholder="Como você se chama?"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="name"
            autoFocus
          />
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Turnstile onToken={setTurnstileToken} onExpired={() => setTurnstileToken(null)} />

      <label className="flex items-start gap-2 text-xs text-muted cursor-pointer select-none">
        <input
          type="checkbox"
          checked={aceitou}
          onChange={(e) => setAceitou(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-cdl-blue cursor-pointer shrink-0"
        />
        <span>
          Li e concordo com os{" "}
          <Link href="/termos" target="_blank" className="text-cdl-blue underline">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" target="_blank" className="text-cdl-blue underline">
            Política de Privacidade
          </Link>
          , autorizando o tratamento dos meus dados nos termos da LGPD.
        </span>
      </label>

      <Button type="submit" loading={loading} disabled={!aceitou} className="w-full">
        Continuar
      </Button>
    </form>
  );
}
