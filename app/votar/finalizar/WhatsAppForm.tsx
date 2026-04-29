"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Etapa = "telefone" | "codigo";

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function WhatsAppForm({
  whatsappAtual,
  redirectAfter = "/votar/obrigado",
}: {
  whatsappAtual: string | null;
  redirectAfter?: string;
}) {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("telefone");
  const [phone, setPhone] = useState(whatsappAtual ? formatPhone(whatsappAtual) : "");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function enviarCodigo(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Digite um número válido com DDD.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/enviar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp: digits }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha ao enviar código.");
        setLoading(false);
        return;
      }
      setEtapa("codigo");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function validarCodigo(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (codigo.replace(/\D/g, "").length !== 6) {
      setError("Código deve ter 6 dígitos.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigo.replace(/\D/g, "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Código inválido.");
        setLoading(false);
        return;
      }
      router.push(redirectAfter);
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  if (etapa === "telefone") {
    return (
      <form onSubmit={enviarCodigo} className="flex flex-col gap-3">
        <Input
          label="Seu WhatsApp"
          name="phone"
          inputMode="tel"
          placeholder="(79) 9 9999-9999"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          error={error ?? undefined}
          maxLength={16}
        />
        <Button type="submit" loading={loading} variant="secondary" className="font-bold">
          Receber código de validação
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={validarCodigo} className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        Enviamos um código de 6 dígitos para <strong>{phone}</strong>.
      </p>
      <Input
        label="Código de validação"
        name="codigo"
        inputMode="numeric"
        placeholder="000000"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
        autoFocus
        maxLength={6}
        error={error ?? undefined}
        className="text-center text-xl tracking-widest"
      />
      <Button type="submit" loading={loading} variant="secondary" className="font-bold">
        Confirmar código
      </Button>
      <button
        type="button"
        onClick={() => {
          setEtapa("telefone");
          setCodigo("");
          setError(null);
        }}
        className="text-sm text-muted hover:text-cdl-blue self-center mt-1"
      >
        ← Trocar número
      </button>
    </form>
  );
}
