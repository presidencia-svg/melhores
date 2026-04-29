"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Etapa = "enviar" | "codigo";

export function RetornarForm() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("enviar");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function enviarCodigo() {
    setErro(null);
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/enviar-codigo-retorno", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Falha ao enviar código.");
        return;
      }
      setEtapa("codigo");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function validarCodigo(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    const codigoLimpo = codigo.replace(/\D/g, "");
    if (codigoLimpo.length !== 6) {
      setErro("Código deve ter 6 dígitos.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/validar-retorno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigoLimpo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Código inválido.");
        setLoading(false);
        return;
      }
      router.push("/votar/categorias");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  if (etapa === "enviar") {
    return (
      <div className="flex flex-col gap-3">
        <Button onClick={enviarCodigo} loading={loading} className="w-full">
          Enviar código no WhatsApp
        </Button>
        {erro && (
          <p className="text-sm text-red-600 text-center">{erro}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={validarCodigo} className="flex flex-col gap-4">
      <Input
        label="Código (6 dígitos)"
        name="codigo"
        inputMode="numeric"
        placeholder="000000"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
        autoFocus
        maxLength={6}
      />
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <Button type="submit" loading={loading} className="w-full">
        Confirmar e continuar votando
      </Button>
      <button
        type="button"
        onClick={enviarCodigo}
        disabled={loading}
        className="text-xs text-cdl-blue hover:underline mt-1"
      >
        Não recebi — reenviar código
      </button>
    </form>
  );
}
