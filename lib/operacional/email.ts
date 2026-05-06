// Envio de email transacional via Resend.
//
// Usado pra:
//   - Boas-vindas no signup (URL de login + proximos passos)
//   - (futuro) recuperacao de senha
//   - (futuro) avisos de deploy/dominio pronto
//
// Gracioso: se RESEND_API_KEY nao estiver setada, retorna { skipped: true }
// e nao quebra o fluxo. Logs ficam em prod no console pra investigar.
//
// ENV vars:
//   RESEND_API_KEY  — pega no dashboard do Resend
//   RESEND_FROM     — email remetente (ex: "Melhores do Ano <ola@melhoresdoano.app.br>")
//                     dominio precisa estar verificado no Resend (SPF/DKIM)

import axios from "axios";

const RESEND_API = "https://api.resend.com/emails";

export type EmailResult =
  | { ok: true; id: string }
  | { ok: false; detalhe: string }
  | { skipped: true; motivo: string };

function getEnv() {
  return {
    apiKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.RESEND_FROM ?? "Melhores do Ano <ola@melhoresdoano.app.br>",
  };
}

export function emailConfigurado(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

type EnviarEmailInput = {
  para: string;
  assunto: string;
  html: string;
  texto?: string;
};

async function enviarRaw(input: EnviarEmailInput): Promise<EmailResult> {
  const env = getEnv();
  if (!env.apiKey) {
    return { skipped: true, motivo: "RESEND_API_KEY nao configurada" };
  }
  try {
    const { data } = await axios.post(
      RESEND_API,
      {
        from: env.from,
        to: input.para,
        subject: input.assunto,
        html: input.html,
        text: input.texto,
      },
      {
        headers: {
          Authorization: `Bearer ${env.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    return { ok: true, id: data.id ?? "?" };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return {
        ok: false,
        detalhe:
          (err.response?.data as { message?: string })?.message ?? err.message,
      };
    }
    return {
      ok: false,
      detalhe: err instanceof Error ? err.message : "erro desconhecido",
    };
  }
}

// Email de boas-vindas pos-signup.
export async function enviarEmailBoasVindas(
  para: string,
  tenant: { nome: string; slug: string; dominio: string | null }
): Promise<EmailResult> {
  const url = tenant.dominio ? `https://${tenant.dominio}` : "";
  const loginUrl = url ? `${url}/admin/login` : "";

  const html = `
<!doctype html>
<html lang="pt-BR">
<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#fbf8f1;margin:0;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(10,42,94,0.08);">
    <h1 style="color:#0a2a5e;font-size:24px;margin:0 0 16px;">
      Olá, ${escapeHtml(tenant.nome)} 👋
    </h1>
    <p style="color:#374151;line-height:1.6;font-size:15px;">
      Sua conta nos <strong>Melhores do Ano</strong> foi criada com sucesso.
    </p>
    <h2 style="color:#0a2a5e;font-size:18px;margin:24px 0 8px;">
      Próximos passos
    </h2>
    <ol style="color:#374151;line-height:1.7;font-size:15px;padding-left:20px;">
      <li>
        <strong>Faça login no painel admin</strong>${loginUrl ? `:<br><a href="${loginUrl}" style="color:#0a2a5e;">${loginUrl}</a>` : "."}
      </li>
      <li>
        <strong>Crie sua primeira edição</strong> — defina nome da campanha, ano e datas de votação.
      </li>
      <li>
        <strong>Configure WhatsApp Meta</strong> — cole o Phone Number ID da sua conta Business. (Opcional, pode pular.)
      </li>
      <li>
        <strong>Configure Instagram</strong> — pra postar resultados automaticamente. (Opcional.)
      </li>
      <li>
        <strong>Cadastre categorias e candidatos</strong> e abra a votação.
      </li>
    </ol>
    <p style="color:#6b7280;line-height:1.6;font-size:13px;margin-top:32px;">
      Sua conta tem 14 dias de avaliação. Qualquer dúvida, é só responder esse email — a equipe da CDL Aracaju está aqui pra ajudar.
    </p>
    <p style="color:#9ca3af;line-height:1.5;font-size:11px;margin-top:24px;">
      Slug: <code style="background:#f3f4f6;padding:2px 6px;border-radius:3px;">${escapeHtml(tenant.slug)}</code> · ${tenant.dominio ? `Domínio: <code style="background:#f3f4f6;padding:2px 6px;border-radius:3px;">${escapeHtml(tenant.dominio)}</code>` : "Domínio: pendente"}
    </p>
  </div>
</body>
</html>
  `.trim();

  const texto = [
    `Olá, ${tenant.nome}!`,
    "",
    "Sua conta nos Melhores do Ano foi criada com sucesso.",
    "",
    "Próximos passos:",
    `1. Faça login: ${loginUrl || "(URL pendente)"}`,
    "2. Crie sua primeira edição",
    "3. Configure WhatsApp Meta (opcional)",
    "4. Configure Instagram (opcional)",
    "5. Cadastre categorias e candidatos",
    "",
    "Conta com 14 dias de avaliação. Dúvidas? Responda esse email.",
  ].join("\n");

  return enviarRaw({
    para,
    assunto: `Bem-vindo aos Melhores do Ano, ${tenant.nome}`,
    html,
    texto,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
