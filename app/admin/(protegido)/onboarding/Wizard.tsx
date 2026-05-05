"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, ExternalLink } from "lucide-react";

const ANO_ATUAL = new Date().getFullYear();

// ============================================================================
// Step 1 — Edição (obrigatorio)
// ============================================================================

export function EdicaoStep({
  edicaoExistente,
  tenantNome,
}: {
  edicaoExistente: { ano: number; nome: string } | null;
  tenantNome: string;
}) {
  const router = useRouter();
  const sugestaoNome = edicaoExistente
    ? edicaoExistente.nome
    : `Melhores do Ano ${tenantNome} ${ANO_ATUAL}`;
  const sugestaoAno = edicaoExistente?.ano ?? ANO_ATUAL;

  const [ano, setAno] = useState<number>(sugestaoAno);
  const [nome, setNome] = useState<string>(sugestaoNome);
  const [inicio, setInicio] = useState<string>("");
  const [fim, setFim] = useState<string>("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Se ja existe edicao, pula direto pro proximo step.
  if (edicaoExistente) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-cdl-green-dark">
          <CheckCircle2 className="w-6 h-6" />
          <p className="font-medium">
            Edição <strong>{edicaoExistente.nome}</strong> já criada.
          </p>
        </div>
        <p className="text-sm text-muted">
          Pra editar datas/nome depois, vá em{" "}
          <code className="bg-zinc-100 px-1 rounded">/admin</code>.
        </p>
        <Link
          href="/admin/onboarding?step=meta"
          className="inline-flex h-10 items-center px-4 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark"
        >
          Próximo: WhatsApp
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!inicio || !fim) {
      setErro("Defina início e fim da votação");
      return;
    }
    setCarregando(true);
    try {
      const res = await fetch("/api/admin/onboarding/edicao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ano,
          nome,
          inicio_votacao: new Date(inicio).toISOString(),
          fim_votacao: new Date(fim).toISOString(),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErro(json.error ?? "Falha");
        return;
      }
      router.push("/admin/onboarding?step=meta");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-bold text-cdl-blue">
          Crie a primeira edição
        </h2>
        <p className="text-sm text-muted mt-1">
          Define quando a votação abre e fecha. Pode editar depois.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <label className="text-sm font-medium text-cdl-blue">
          Ano
          <input
            required
            type="number"
            value={ano}
            onChange={(e) => setAno(parseInt(e.target.value, 10) || ANO_ATUAL)}
            min={2024}
            max={2100}
            className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3 font-mono"
            disabled={carregando}
          />
        </label>
        <label className="text-sm font-medium text-cdl-blue sm:col-span-2">
          Nome
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={120}
            className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3"
            disabled={carregando}
          />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm font-medium text-cdl-blue">
          Início da votação
          <input
            required
            type="datetime-local"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3"
            disabled={carregando}
          />
        </label>
        <label className="text-sm font-medium text-cdl-blue">
          Fim da votação
          <input
            required
            type="datetime-local"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3"
            disabled={carregando}
          />
        </label>
      </div>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <button
        type="submit"
        disabled={carregando}
        className="h-11 inline-flex items-center justify-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark disabled:opacity-50"
      >
        {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Criar edição
      </button>
    </form>
  );
}

// ============================================================================
// Step 2 — Meta WhatsApp (opcional)
// ============================================================================

type MetaValores = {
  meta_phone_number_id: string | null;
  meta_template_otp: string | null;
  meta_template_incentivo: string | null;
  meta_template_incentivo_empate: string | null;
  meta_template_parcial: string | null;
  meta_template_lang: string | null;
};

export function MetaStep({ valoresAtuais }: { valoresAtuais: MetaValores }) {
  const router = useRouter();
  const [phoneId, setPhoneId] = useState(
    valoresAtuais.meta_phone_number_id ?? ""
  );
  const [templOtp, setTemplOtp] = useState(
    valoresAtuais.meta_template_otp ?? "codigo_verificacao"
  );
  const [templIncentivo, setTemplIncentivo] = useState(
    valoresAtuais.meta_template_incentivo ?? "incentivo_voto"
  );
  const [templEmpate, setTemplEmpate] = useState(
    valoresAtuais.meta_template_incentivo_empate ?? "incentivo_empate"
  );
  const [templParcial, setTemplParcial] = useState(
    valoresAtuais.meta_template_parcial ?? "parcial_voto"
  );
  const [lang, setLang] = useState(valoresAtuais.meta_template_lang ?? "pt_BR");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/admin/onboarding/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meta_phone_number_id: phoneId.trim() || null,
          meta_template_otp: templOtp.trim(),
          meta_template_incentivo: templIncentivo.trim(),
          meta_template_incentivo_empate: templEmpate.trim(),
          meta_template_parcial: templParcial.trim(),
          meta_template_lang: lang.trim(),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErro(json.error ?? "Falha");
        return;
      }
      router.push("/admin/onboarding?step=instagram");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-bold text-cdl-blue">
          WhatsApp Meta (opcional)
        </h2>
        <p className="text-sm text-muted mt-1">
          Cole o <strong>Phone Number ID</strong> da sua conta WhatsApp
          Business no Meta Business Manager. Pode pular e configurar depois.
        </p>
        <a
          href="https://business.facebook.com/wa/manage/phone-numbers/"
          target="_blank"
          rel="noopener"
          className="text-xs text-cdl-blue hover:underline inline-flex items-center gap-1 mt-2"
        >
          Abrir Meta Business Manager
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <label className="text-sm font-medium text-cdl-blue">
        Phone Number ID
        <input
          value={phoneId}
          onChange={(e) =>
            setPhoneId(e.target.value.replace(/\D/g, "").slice(0, 30))
          }
          placeholder="123456789012345"
          className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3 font-mono"
          disabled={carregando}
        />
      </label>

      <details className="text-sm">
        <summary className="text-cdl-blue cursor-pointer hover:underline">
          Configurar nomes dos templates Meta (avançado)
        </summary>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <label className="text-xs font-medium text-cdl-blue">
            Template OTP
            <input
              value={templOtp}
              onChange={(e) => setTemplOtp(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-border bg-white px-2 font-mono text-xs"
              disabled={carregando}
            />
          </label>
          <label className="text-xs font-medium text-cdl-blue">
            Template Incentivo
            <input
              value={templIncentivo}
              onChange={(e) => setTemplIncentivo(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-border bg-white px-2 font-mono text-xs"
              disabled={carregando}
            />
          </label>
          <label className="text-xs font-medium text-cdl-blue">
            Template Incentivo Empate
            <input
              value={templEmpate}
              onChange={(e) => setTemplEmpate(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-border bg-white px-2 font-mono text-xs"
              disabled={carregando}
            />
          </label>
          <label className="text-xs font-medium text-cdl-blue">
            Template Parcial
            <input
              value={templParcial}
              onChange={(e) => setTemplParcial(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-border bg-white px-2 font-mono text-xs"
              disabled={carregando}
            />
          </label>
          <label className="text-xs font-medium text-cdl-blue">
            Idioma
            <input
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-border bg-white px-2 font-mono text-xs"
              disabled={carregando}
            />
          </label>
        </div>
      </details>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={carregando}
          className="h-11 inline-flex items-center justify-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark disabled:opacity-50 px-6"
        >
          {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Salvar e continuar
        </button>
        <Link
          href="/admin/onboarding?step=instagram"
          className="h-11 inline-flex items-center px-4 rounded-md border border-border text-muted hover:bg-zinc-50"
        >
          Pular
        </Link>
      </div>
    </form>
  );
}

// ============================================================================
// Step 3 — Instagram (opcional)
// ============================================================================

type InstagramValores = {
  instagram_page_access_token: string | null;
  instagram_business_account_id: string | null;
  instagram_facebook_page_id: string | null;
  instagram_username: string | null;
};

export function InstagramStep({
  valoresAtuais,
}: {
  valoresAtuais: InstagramValores;
}) {
  const router = useRouter();
  const [token, setToken] = useState(
    valoresAtuais.instagram_page_access_token ?? ""
  );
  const [businessId, setBusinessId] = useState(
    valoresAtuais.instagram_business_account_id ?? ""
  );
  const [pageId, setPageId] = useState(
    valoresAtuais.instagram_facebook_page_id ?? ""
  );
  const [username, setUsername] = useState(
    valoresAtuais.instagram_username ?? ""
  );
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/admin/onboarding/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagram_page_access_token: token.trim() || null,
          instagram_business_account_id: businessId.trim() || null,
          instagram_facebook_page_id: pageId.trim() || null,
          instagram_username: username.trim().replace(/^@/, "") || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErro(json.error ?? "Falha");
        return;
      }
      router.push("/admin/onboarding?step=concluir");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha de rede");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-bold text-cdl-blue">
          Instagram (opcional)
        </h2>
        <p className="text-sm text-muted mt-1">
          Pra postar resultados automaticamente no perfil da sua organização.
          Pode pular agora e configurar depois.
        </p>
        <a
          href="https://developers.facebook.com/docs/instagram-api/getting-started"
          target="_blank"
          rel="noopener"
          className="text-xs text-cdl-blue hover:underline inline-flex items-center gap-1 mt-2"
        >
          Como gerar os tokens
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <label className="text-sm font-medium text-cdl-blue">
        @username (sem o @)
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="suacdl"
          maxLength={30}
          className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3 font-mono"
          disabled={carregando}
        />
      </label>

      <label className="text-sm font-medium text-cdl-blue">
        Page Access Token
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={3}
          placeholder="EAA..."
          className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-xs"
          disabled={carregando}
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm font-medium text-cdl-blue">
          Business Account ID
          <input
            value={businessId}
            onChange={(e) =>
              setBusinessId(e.target.value.replace(/\D/g, ""))
            }
            placeholder="178414..."
            className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3 font-mono"
            disabled={carregando}
          />
        </label>
        <label className="text-sm font-medium text-cdl-blue">
          Facebook Page ID
          <input
            value={pageId}
            onChange={(e) => setPageId(e.target.value.replace(/\D/g, ""))}
            placeholder="143242..."
            className="mt-1 w-full h-10 rounded-md border border-border bg-white px-3 font-mono"
            disabled={carregando}
          />
        </label>
      </div>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={carregando}
          className="h-11 inline-flex items-center justify-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark disabled:opacity-50 px-6"
        >
          {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Salvar e continuar
        </button>
        <Link
          href="/admin/onboarding?step=concluir"
          className="h-11 inline-flex items-center px-4 rounded-md border border-border text-muted hover:bg-zinc-50"
        >
          Pular
        </Link>
      </div>
    </form>
  );
}

// ============================================================================
// Step 4 — Concluir
// ============================================================================

export function ConcluirStep({
  temMeta,
  temInstagram,
}: {
  temMeta: boolean;
  temInstagram: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 text-cdl-green-dark">
        <CheckCircle2 className="w-8 h-8" />
        <h2 className="font-display text-2xl font-bold">Tudo pronto!</h2>
      </div>

      <p className="text-sm text-muted">
        Próximos passos no painel:
      </p>

      <ol className="space-y-3 text-sm">
        <li className="flex gap-2">
          <span className="text-cdl-blue font-bold">1.</span>
          <span>
            <strong>Criar categorias e subcategorias</strong> em{" "}
            <code className="bg-zinc-100 px-1 rounded">/admin/categorias</code>
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-cdl-blue font-bold">2.</span>
          <span>
            <strong>Cadastrar candidatos</strong> em{" "}
            <code className="bg-zinc-100 px-1 rounded">/admin/candidatos</code>
          </span>
        </li>
        {!temMeta ? (
          <li className="flex gap-2">
            <span className="text-orange-600 font-bold">⚠</span>
            <span className="text-orange-700">
              <strong>WhatsApp não configurado</strong> — votantes não vão
              receber OTP nem mensagens de incentivo. Configure em{" "}
              <Link
                href="/admin/onboarding?step=meta"
                className="text-cdl-blue hover:underline"
              >
                voltar pro WhatsApp
              </Link>
              .
            </span>
          </li>
        ) : null}
        {!temInstagram ? (
          <li className="flex gap-2">
            <span className="text-muted">○</span>
            <span className="text-muted">
              Instagram não configurado — você ainda pode baixar cards e
              postar manualmente.
            </span>
          </li>
        ) : null}
      </ol>

      <Link
        href="/admin"
        className="h-11 inline-flex items-center px-6 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark"
      >
        Ir pro painel
      </Link>
    </div>
  );
}
