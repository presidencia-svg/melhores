"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Turnstile } from "@/components/voto/Turnstile";

function mascararCnpj(input: string): string {
  const d = input.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function sugerirSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .trim()
    .replace(/\s+/g, "")
    .slice(0, 30);
}

export function CadastroForm() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTocado, setSlugTocado] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const slugFinal = slugTocado ? slug : sugerirSlug(nome);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem");
      return;
    }
    if (senha.length < 8) {
      setErro("Senha precisa de 8+ caracteres");
      return;
    }
    if (!aceitouTermos) {
      setErro("Aceite os termos pra continuar");
      return;
    }

    setCarregando(true);
    try {
      const res = await fetch("/api/cadastrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          cnpj,
          slug: slugFinal,
          admin_email: email,
          senha,
          termos: true,
          turnstile: turnstileToken,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        tenant?: { slug: string; nome: string; dominio: string };
        operacional?: { dnsAuto: boolean; emailEnviado: boolean };
      };
      if (!res.ok || !json.tenant) {
        setErro(json.error ?? "Falha no cadastro");
        if (typeof window !== "undefined" && window.__turnstileReset) {
          window.__turnstileReset();
        }
        setTurnstileToken(null);
        return;
      }
      const params = new URLSearchParams({
        slug: json.tenant.slug,
        dominio: json.tenant.dominio,
        dns: json.operacional?.dnsAuto ? "1" : "0",
        email: json.operacional?.emailEnviado ? "1" : "0",
      });
      router.push(
        `/cadastrar/sucesso?${params.toString()}`
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="text-sm font-medium text-cdl-blue">
        Nome da CDL ou organização
        <input
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3"
          placeholder="Ex: CDL São Paulo"
          maxLength={80}
          disabled={carregando}
        />
      </label>

      <label className="text-sm font-medium text-cdl-blue">
        CNPJ
        <input
          required
          value={cnpj}
          onChange={(e) => setCnpj(mascararCnpj(e.target.value))}
          className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3 font-mono"
          placeholder="00.000.000/0000-00"
          inputMode="numeric"
          disabled={carregando}
        />
      </label>

      <label className="text-sm font-medium text-cdl-blue">
        Identificador (URL)
        <div className="mt-1 flex items-center rounded-md border border-border bg-white overflow-hidden">
          <input
            required
            value={slugFinal}
            onChange={(e) => {
              setSlug(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "")
                  .slice(0, 30)
              );
              setSlugTocado(true);
            }}
            className="flex-1 h-10 px-3"
            placeholder="cdlsaopaulo"
            minLength={3}
            maxLength={30}
            pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
            disabled={carregando}
          />
          <span className="px-3 text-xs text-muted bg-zinc-50 h-10 flex items-center">
            .melhoresdoano.app.br
          </span>
        </div>
        <p className="text-xs text-muted mt-1">
          Letras, números e hífen. Define a URL da sua votação.
        </p>
      </label>

      <label className="text-sm font-medium text-cdl-blue">
        Email do responsável
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3"
          placeholder="presidencia@cdl..."
          maxLength={120}
          disabled={carregando}
        />
      </label>

      <label className="text-sm font-medium text-cdl-blue">
        Senha do painel admin (8+ caracteres)
        <input
          required
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3"
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          disabled={carregando}
        />
      </label>

      <label className="text-sm font-medium text-cdl-blue">
        Confirmar senha
        <input
          required
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3"
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          disabled={carregando}
        />
      </label>

      <label className="flex gap-2 items-start text-sm text-foreground">
        <input
          type="checkbox"
          checked={aceitouTermos}
          onChange={(e) => setAceitouTermos(e.target.checked)}
          className="mt-1"
          disabled={carregando}
        />
        <span>
          Li e aceito os{" "}
          <Link
            href="/termos"
            target="_blank"
            className="text-cdl-blue hover:underline"
          >
            Termos
          </Link>{" "}
          e a{" "}
          <Link
            href="/privacidade"
            target="_blank"
            className="text-cdl-blue hover:underline"
          >
            Política de Privacidade
          </Link>
          .
        </span>
      </label>

      <Turnstile
        onToken={setTurnstileToken}
        onExpired={() => setTurnstileToken(null)}
      />

      {erro ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {erro}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={carregando}
        className="h-11 inline-flex items-center justify-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark disabled:opacity-50"
      >
        {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Criar conta
      </button>
    </form>
  );
}
