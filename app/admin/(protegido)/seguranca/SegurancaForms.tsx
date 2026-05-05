"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Form pra ativar 2FA. Recebe `secret` ja gerado server-side; usuario digita
// o codigo de 6 digitos do app autenticador, validamos no backend e gravamos
// em tenants.admin_totp_secret.
export function AtivarTotpForm({ secret }: { secret: string }) {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (codigo.length !== 6) return;
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/admin/seguranca/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, codigo }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErro(json.error ?? "Falha ao ativar 2FA");
        return;
      }
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
      <label className="text-sm font-medium text-cdl-blue">
        Código do app (6 dígitos)
        <input
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3 text-base font-mono tracking-widest"
          placeholder="000000"
          disabled={carregando}
        />
      </label>
      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}
      <button
        type="submit"
        disabled={codigo.length !== 6 || carregando}
        className="h-10 inline-flex items-center justify-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark transition-colors disabled:opacity-50"
      >
        {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Ativar 2FA
      </button>
    </form>
  );
}

// Botao pra desativar 2FA. Pede codigo atual pra evitar ataque CSRF/clickjack.
export function DesativarTotpButton() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function desativar(e: React.FormEvent) {
    e.preventDefault();
    if (codigo.length !== 6) return;
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/admin/seguranca/totp", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErro(json.error ?? "Falha ao desativar");
        return;
      }
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setCarregando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="text-sm text-red-600 hover:underline mt-2"
      >
        Desativar 2FA
      </button>
    );
  }

  return (
    <form onSubmit={desativar} className="mt-3 flex flex-col gap-2">
      <label className="text-sm font-medium text-cdl-blue">
        Confirme com código de 6 dígitos
        <input
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3 text-base font-mono tracking-widest"
          placeholder="000000"
          disabled={carregando}
        />
      </label>
      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={codigo.length !== 6 || carregando}
          className="h-9 px-4 inline-flex items-center justify-center gap-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Desativar
        </button>
        <button
          type="button"
          onClick={() => {
            setAberto(false);
            setCodigo("");
            setErro(null);
          }}
          className="h-9 px-4 rounded-md border border-border text-sm hover:bg-zinc-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// Form pra trocar senha do admin do tenant.
export function TrocarSenhaForm() {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirm, setConfirm] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (nova.length < 8) {
      setErro("Senha nova precisa de 8+ caracteres");
      return;
    }
    if (nova !== confirm) {
      setErro("Senhas não conferem");
      return;
    }
    setCarregando(true);
    setErro(null);
    setOk(false);
    try {
      const res = await fetch("/api/admin/seguranca/senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atual, nova }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErro(json.error ?? "Falha ao trocar senha");
        return;
      }
      setOk(true);
      setAtual("");
      setNova("");
      setConfirm("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
      <label className="text-sm font-medium text-cdl-blue">
        Senha atual
        <input
          type="password"
          value={atual}
          onChange={(e) => setAtual(e.target.value)}
          className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3"
          autoComplete="current-password"
          disabled={carregando}
        />
      </label>
      <label className="text-sm font-medium text-cdl-blue">
        Nova senha (8+ caracteres)
        <input
          type="password"
          value={nova}
          onChange={(e) => setNova(e.target.value)}
          className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3"
          autoComplete="new-password"
          disabled={carregando}
          minLength={8}
        />
      </label>
      <label className="text-sm font-medium text-cdl-blue">
        Confirmar nova senha
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3"
          autoComplete="new-password"
          disabled={carregando}
          minLength={8}
        />
      </label>
      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}
      {ok ? (
        <p className="text-sm text-cdl-green-dark">✓ Senha trocada com sucesso</p>
      ) : null}
      <button
        type="submit"
        disabled={!atual || nova.length < 8 || nova !== confirm || carregando}
        className="h-10 inline-flex items-center justify-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark disabled:opacity-50"
      >
        {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Trocar senha
      </button>
    </form>
  );
}
