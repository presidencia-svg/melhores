"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginForm({ totpEnabled }: { totpEnabled: boolean }) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha, codigo: totpEnabled ? codigo : undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Falha no login");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Erro de conexão");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        label="Senha"
        type="password"
        name="senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        autoFocus
        error={!totpEnabled ? error ?? undefined : undefined}
      />

      {totpEnabled && (
        <Input
          label="Código de 6 dígitos (Google Authenticator)"
          type="text"
          inputMode="numeric"
          name="codigo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          placeholder="000000"
          className="text-center text-xl tracking-widest"
          error={error ?? undefined}
        />
      )}

      {!totpEnabled && error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Entrar
      </Button>
    </form>
  );
}
