"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCpf, isValidCpf, onlyDigits } from "@/lib/cpf";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { Turnstile } from "@/components/voto/Turnstile";

export function CpfForm() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [aceitou, setAceitou] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  function handleChange(value: string) {
    const digits = onlyDigits(value).slice(0, 11);
    setCpf(digits.length > 0 ? formatCpf(digits) : "");
    if (error) setError(undefined);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);

    if (!aceitou) {
      setError("Você precisa aceitar os Termos e a Política de Privacidade.");
      return;
    }

    if (turnstileRequired && !turnstileToken) {
      setError("Aguarde a verificação anti-robô concluir.");
      return;
    }

    const numeros = onlyDigits(cpf);
    if (!isValidCpf(numeros)) {
      setError("CPF inválido. Confira os números.");
      return;
    }

    setLoading(true);
    try {
      const fingerprint = await getDeviceFingerprint().catch(() => null);
      const res = await fetch("/api/identificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: numeros, fingerprint, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível continuar. Tente novamente.");
        return;
      }
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
        onChange={(e) => handleChange(e.target.value)}
        autoComplete="off"
        autoFocus
        error={error}
        maxLength={14}
      />

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
