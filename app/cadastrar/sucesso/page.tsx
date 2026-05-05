import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Logo } from "@/components/brand/Logo";
import { CheckCircle2, Mail, Globe2, KeyRound } from "lucide-react";

export const metadata = {
  title: "Cadastro recebido — Melhores do Ano",
};

export default async function SucessoPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const sp = await searchParams;
  const slug = sp.slug ?? "";
  const dominioFinal = slug ? `${slug}.cdlaju.com.br` : "";

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
                    1. Sua URL será ativada em até 24h
                  </h3>
                  {dominioFinal ? (
                    <p className="text-sm text-muted mt-1">
                      Endereço:{" "}
                      <code className="bg-zinc-100 px-2 py-0.5 rounded">
                        https://{dominioFinal}
                      </code>
                    </p>
                  ) : null}
                  <p className="text-xs text-muted mt-1">
                    A equipe da CDL Aracaju configura o DNS e te avisa por
                    email quando estiver no ar.
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <KeyRound className="w-5 h-5 text-cdl-blue shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-cdl-blue">
                    2. Faça login no painel admin
                  </h3>
                  <p className="text-sm text-muted mt-1">
                    Quando o domínio estiver ativo, acesse{" "}
                    <code className="bg-zinc-100 px-2 py-0.5 rounded">
                      /admin/login
                    </code>{" "}
                    com o email e a senha que você cadastrou.
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <Mail className="w-5 h-5 text-cdl-blue shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-cdl-blue">
                    3. Configure WhatsApp e Instagram
                  </h3>
                  <p className="text-sm text-muted mt-1">
                    No painel você vai colar o phone_number_id do Meta
                    WhatsApp e os tokens do Instagram da sua organização.
                    Documentação passo a passo é entregue junto com o
                    primeiro acesso.
                  </p>
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
