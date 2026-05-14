"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, ExternalLink, MessageSquare, MessageSquareOff } from "lucide-react";

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
// Step 2 — WhatsApp (opcional)
//
// Envio dos disparos sempre passa pelo numero do super admin (env
// META_WHATSAPP_PHONE_IDS), entao o tenant so escolhe se quer ou nao
// validacao OTP. Sem cadastro de Phone Number ID, sem nomes de template.
// ============================================================================

type ModoValidacao = "meta" | "sem_validacao";

export function MetaStep({
  jaConfigurado,
  validacaoLigada,
}: {
  jaConfigurado: boolean;
  validacaoLigada: boolean;
}) {
  const router = useRouter();
  const [modo, setModo] = useState<ModoValidacao>(
    jaConfigurado && !validacaoLigada ? "sem_validacao" : "meta"
  );
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function submit() {
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/admin/onboarding/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validacao: modo === "meta" }),
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
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-bold text-cdl-blue">
          Validação dos votantes
        </h2>
        <p className="text-sm text-muted mt-1">
          Como você quer validar a identidade dos votantes? Pode mudar depois
          em <code className="bg-zinc-100 px-1 rounded">/admin</code>.
        </p>
      </div>

      <div className="rounded-lg border border-cdl-blue/30 bg-cdl-blue/5 p-3 text-xs text-cdl-blue leading-relaxed">
        <strong>Os disparos saem do número oficial da plataforma</strong> —
        você não precisa de conta Meta nem Phone Number ID próprio. Só
        escolhe se quer pedir código WhatsApp pros votantes ou não.
      </div>

      {/* Modo selector */}
      <div className="grid sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setModo("meta")}
          className={`text-left p-4 rounded-lg border-2 transition-colors ${
            modo === "meta"
              ? "border-cdl-blue bg-cdl-blue/5"
              : "border-border hover:border-cdl-blue/50"
          }`}
        >
          <div className="flex items-center gap-2 font-medium text-cdl-blue mb-1">
            <MessageSquare className="w-4 h-4" /> Com WhatsApp
            <span className="text-[10px] uppercase tracking-wider bg-cdl-green/15 text-cdl-green-dark px-1.5 py-0.5 rounded">
              Recomendado
            </span>
          </div>
          <p className="text-xs text-muted">
            CPF + selfie + OTP no WhatsApp. Anti-fraude máximo. Cada OTP
            consome créditos da carteira do tenant.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setModo("sem_validacao")}
          className={`text-left p-4 rounded-lg border-2 transition-colors ${
            modo === "sem_validacao"
              ? "border-cdl-blue bg-cdl-blue/5"
              : "border-border hover:border-cdl-blue/50"
          }`}
        >
          <div className="flex items-center gap-2 font-medium text-cdl-blue mb-1">
            <MessageSquareOff className="w-4 h-4" /> Sem WhatsApp
          </div>
          <p className="text-xs text-muted">
            CPF + selfie apenas (sem código). Mais simples pro votante,
            menos rigoroso anti-fraude. Não consome créditos de OTP.
          </p>
        </button>
      </div>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={submit}
          disabled={carregando}
          className="h-11 inline-flex items-center justify-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark disabled:opacity-50 px-6"
        >
          {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {modo === "meta" ? "Ativar WhatsApp e continuar" : "Confirmar sem WhatsApp"}
        </button>
        <Link
          href="/admin/onboarding?step=instagram"
          className="h-11 inline-flex items-center px-4 rounded-md border border-border text-muted hover:bg-zinc-50"
        >
          Pular
        </Link>
      </div>
    </div>
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
      </div>

      <details className="text-sm rounded-lg border border-border bg-zinc-50/60 p-3">
        <summary className="text-cdl-blue cursor-pointer hover:underline font-medium">
          📖 Como conseguir os tokens (passo a passo)
        </summary>
        <ol className="list-decimal pl-5 space-y-3 mt-3 text-xs text-foreground leading-relaxed">
          <li>
            <strong>Conectar Instagram Business à Página Facebook</strong>:
            no app do Instagram → Configurações → Conta → Conta Profissional
            → escolher categoria. Depois Conectar Página → vincular à Página
            Facebook da sua organização. (Se não tem Página Facebook, criar
            uma em{" "}
            <a
              href="https://www.facebook.com/pages/create"
              target="_blank"
              rel="noopener"
              className="text-cdl-blue hover:underline"
            >
              facebook.com/pages/create
            </a>
            ).
          </li>
          <li>
            <strong>Criar App Meta for Developers</strong>: acesse{" "}
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noopener"
              className="text-cdl-blue hover:underline"
            >
              developers.facebook.com/apps
            </a>{" "}
            → <em>Create App</em> → tipo <strong>Business</strong> →
            preenche nome e email.
          </li>
          <li>
            <strong>Adicionar produto Instagram Graph API</strong>: dentro
            do app criado, em <em>Add Products</em> → Instagram → Set Up.
            Aceita os termos.
          </li>
          <li>
            <strong>Gerar User Access Token</strong>: no menu lateral →
            Tools → <em>Graph API Explorer</em>. No dropdown <em>App</em>,
            seleciona o app criado. Em <em>Permissions</em> adiciona:
            <code className="bg-white/60 px-1 rounded mx-1 text-[10px]">
              pages_show_list
            </code>
            <code className="bg-white/60 px-1 rounded mx-1 text-[10px]">
              pages_read_engagement
            </code>
            <code className="bg-white/60 px-1 rounded mx-1 text-[10px]">
              instagram_basic
            </code>
            <code className="bg-white/60 px-1 rounded mx-1 text-[10px]">
              instagram_content_publish
            </code>
            . Clica <em>Generate Access Token</em> → autoriza com a conta
            Facebook que administra a Página.
          </li>
          <li>
            <strong>Pegar Page ID e Page Access Token</strong>: no Graph
            API Explorer, na barra de URL digite{" "}
            <code className="bg-white/60 px-1 rounded text-[10px]">
              me/accounts
            </code>{" "}
            → Submit. Resposta JSON lista suas páginas. Procure a sua e
            copie:
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              <li>
                <code className="bg-white/60 px-1 rounded text-[10px]">
                  id
                </code>{" "}
                → cole em <strong>Facebook Page ID</strong>
              </li>
              <li>
                <code className="bg-white/60 px-1 rounded text-[10px]">
                  access_token
                </code>{" "}
                → cole em <strong>Page Access Token</strong> (esse é o
                token longo que você precisa)
              </li>
            </ul>
          </li>
          <li>
            <strong>Pegar Instagram Business Account ID</strong>: no Graph
            API Explorer, query{" "}
            <code className="bg-white/60 px-1 rounded text-[10px]">
              {`{page-id}?fields=instagram_business_account`}
            </code>{" "}
            (substitui {`{page-id}`} pelo ID copiado no passo anterior). A
            resposta tem{" "}
            <code className="bg-white/60 px-1 rounded text-[10px]">
              instagram_business_account.id
            </code>{" "}
            → cole em <strong>Business Account ID</strong>.
          </li>
          <li>
            <strong>Tornar token permanente</strong> (importante!): tokens
            do Graph API Explorer expiram em ~2h. Pra deixar permanente,
            faça GET pra{" "}
            <code className="bg-white/60 px-1 rounded text-[10px]">
              {`/{page-id}?fields=access_token&access_token=USER_TOKEN`}
            </code>{" "}
            depois de gerar um Long-Lived User Token (ver{" "}
            <a
              href="https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived"
              target="_blank"
              rel="noopener"
              className="text-cdl-blue hover:underline"
            >
              docs Meta
            </a>
            ). Esse token de página derivado de Long-Lived User Token não
            expira.
          </li>
        </ol>
        <p className="text-xs text-orange-700 mt-3 leading-relaxed">
          ⚠ Esse processo é chato e tem várias armadilhas. Se travar, manda
          mensagem pra equipe da CDL Aracaju que a gente te ajuda a
          configurar essa parte.
        </p>
      </details>

      <a
        href="https://developers.facebook.com/docs/instagram-api/getting-started"
        target="_blank"
        rel="noopener"
        className="text-xs text-cdl-blue hover:underline inline-flex items-center gap-1"
      >
        Documentação oficial Meta
        <ExternalLink className="w-3 h-3" />
      </a>

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
