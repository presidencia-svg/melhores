import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Logo } from "@/components/brand/Logo";
import { CheckCircle2, Mail, Globe2, KeyRound, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Cadastro recebido — Melhores do Ano",
};

export default async function SucessoPage({
  searchParams,
}: {
  searchParams: Promise<{
    slug?: string;
    dominio?: string;
    dns?: string;
    email?: string;
  }>;
}) {
  const sp = await searchParams;
  const slug = sp.slug ?? "";
  const dominio = sp.dominio ?? (slug ? `${slug}.melhoresdoano.app.br` : "");
  const dnsAuto = sp.dns === "1";
  const emailEnviado = sp.email === "1";
  const loginUrl = dominio ? `https://${dominio}/admin/login` : "";

  return (
    <div className="flex flex-col flex-1 min-h-screen items-center justify-center bg-gradient-to-b from-cdl-blue/5 to-background px-4 py-10">
      <div className="w-full max-w-xl mx-auto animate-fade-in">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>

        <Card>
          <CardContent>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-cdl-green/15 text-cdl-green-dark flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="font-display text-2xl font-bold text-cdl-blue">
                Cadastro recebido
              </h1>
              <p className="text-sm text-muted mt-1">
                Sua conta foi criada com sucesso. Veja os próximos passos
                abaixo.
              </p>
            </div>

            <ol className="space-y-5">
              <li className="flex gap-3">
                <Globe2 className="w-5 h-5 text-cdl-blue shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-cdl-blue">
                    1. {dnsAuto ? "Domínio ativado" : "Domínio será ativado em breve"}
                  </h3>
                  {dominio ? (
                    <p className="text-sm text-muted mt-1">
                      Endereço:{" "}
                      <code className="bg-zinc-100 px-2 py-0.5 rounded">
                        https://{dominio}
                      </code>
                    </p>
                  ) : null}
                  {dnsAuto ? (
                    <p className="text-xs text-cdl-green-dark mt-1">
                      ✓ DNS provisionado. SSL emite em ~5 minutos. Refresh
                      depois.
                    </p>
                  ) : (
                    <p className="text-xs text-orange-600 mt-1 inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      DNS automático off — equipe da CDL Aracaju vai ativar
                      manualmente em até 24h.
                    </p>
                  )}
                </div>
              </li>

              <li className="flex gap-3">
                <KeyRound className="w-5 h-5 text-cdl-blue shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-cdl-blue">
                    2. Faça login no painel admin
                  </h3>
                  {loginUrl ? (
                    <p className="text-sm text-muted mt-1">
                      <a
                        href={loginUrl}
                        className="text-cdl-blue hover:underline break-all"
                      >
                        {loginUrl}
                      </a>
                    </p>
                  ) : (
                    <p className="text-sm text-muted mt-1">
                      Use o email e senha que você cadastrou.
                    </p>
                  )}
                </div>
              </li>

              <li className="flex gap-3">
                <Mail className="w-5 h-5 text-cdl-blue shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-cdl-blue">
                    3. {emailEnviado ? "Email de boas-vindas enviado" : "Próximos passos no painel"}
                  </h3>
                  {emailEnviado ? (
                    <p className="text-sm text-muted mt-1">
                      Enviamos um email com link de login + instruções
                      detalhadas pra continuar a configuração (categorias,
                      candidatos, WhatsApp/Instagram).
                    </p>
                  ) : (
                    <p className="text-sm text-muted mt-1">
                      Quando entrar no painel pela primeira vez, um wizard
                      vai te guiar nos passos: criar edição, configurar
                      WhatsApp Meta e Instagram.
                    </p>
                  )}
                </div>
              </li>
            </ol>

            <div className="mt-8 pt-6 border-t border-border text-center">
              <Link
                href="/"
                className="text-sm text-cdl-blue hover:underline"
              >
                Voltar ao início
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
