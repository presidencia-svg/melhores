"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/super/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErro(json.error ?? "Falha no login");
        return;
      }
      router.push("/super");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input
        type="password"
        required
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="Senha super-admin"
        autoFocus
        className="h-11 rounded-md border border-border bg-white px-3"
        disabled={carregando}
      />
      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}
      <button
        type="submit"
        disabled={carregando}
        className="h-11 inline-flex items-center justify-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark disabled:opacity-50"
      >
        {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Entrar
      </button>
    </form>
  );
}
