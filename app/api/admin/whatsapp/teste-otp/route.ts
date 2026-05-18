import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import {
  enviarTemplateAutenticacao,
  metaConfigurada,
} from "@/lib/meta-whatsapp/client";

// Dispara um OTP de teste pro numero informado, SEM cobrar o saldo do
// tenant (e' uso interno do admin pra validar a integracao Meta). Nao
// grava nada em whatsapp_codigos — so manda a mensagem.

const Body = z.object({
  whatsapp: z.string().min(10).max(20),
});

const META_TEMPLATE_OTP =
  process.env.META_TEMPLATE_OTP ?? "codigo_verificacao_2025";
const META_TEMPLATE_LANG = process.env.META_TEMPLATE_LANG ?? "pt_BR";

function gerarCodigoTeste(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!metaConfigurada()) {
    return NextResponse.json(
      {
        error:
          "Meta WhatsApp não configurada (META_WHATSAPP_TOKEN ou META_WHATSAPP_PHONE_IDS ausente)",
      },
      { status: 503 }
    );
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Número inválido (10–20 dígitos)" },
      { status: 400 }
    );
  }

  const numero = parsed.data.whatsapp.replace(/\D/g, "");
  const codigo = gerarCodigoTeste();

  const r = await enviarTemplateAutenticacao(
    numero,
    META_TEMPLATE_OTP,
    META_TEMPLATE_LANG,
    codigo
  );

  if (!r.ok) {
    return NextResponse.json(
      {
        ok: false,
        codigo,
        template: META_TEMPLATE_OTP,
        language: META_TEMPLATE_LANG,
        numero,
        detalhe: r.detalhe ?? "erro desconhecido",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    codigo,
    template: META_TEMPLATE_OTP,
    language: META_TEMPLATE_LANG,
    numero,
    raw: r.raw,
  });
}
