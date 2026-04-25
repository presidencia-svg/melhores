"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCpf, isValidCpf, onlyDigits } from "@/lib/cpf";

export function CpfForm() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  function handleChange(value: string) {
    const digits = onlyDigits(value).slice(0, 11);
    setCpf(digits.length > 0 ? formatCpf(digits) : "");
    if (error) setError(undefined);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);

    const numeros = onlyDigits(cpf);
    if (!isValidCpf(numeros)) {
      setError("CPF inválido. Confira os números.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/identificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: numeros }),
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

      <Button type="submit" loading={loading} className="w-full">
        Continuar
      </Button>
    </form>
  );
}
