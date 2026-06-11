import { Card, CardContent } from "@/components/ui/Card";
import { MessageSquare, Instagram } from "lucide-react";
import { TesteOtpForm } from "../whatsapp/teste/TesteOtpForm";
import { TesteInstagramBotao } from "./TesteInstagramBotao";

export const dynamic = "force-dynamic";

export default function IntegracoesPage() {
  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cdl-blue">
          Testar integrações
        </h1>
        <p className="text-muted mt-1 text-sm leading-relaxed">
          Diagnóstico rápido pra confirmar que WhatsApp e Instagram estão
          respondendo. Nenhum teste cobra do saldo nem posta em público.
        </p>
      </header>

      <div className="grid gap-5">
        {/* WhatsApp */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-cdl-blue">
                  WhatsApp (Meta)
                </h2>
                <p className="text-xs text-muted">
                  Envia um OTP de teste real pro seu número. Não cobra do
                  saldo — uso interno de diagnóstico.
                </p>
              </div>
            </div>
            <TesteOtpForm />
          </CardContent>
        </Card>

        {/* Instagram */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-cdl-blue">
                  Instagram (Graph API)
                </h2>
                <p className="text-xs text-muted">
                  Valida credenciais lendo dados da conta conectada (username,
                  seguidores, posts). NÃO publica nada — leitura pura.
                </p>
              </div>
            </div>
            <TesteInstagramBotao />
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted mt-6">
        Pra postar um carrossel de verdade, use{" "}
        <a
          href="/admin/podium"
          className="text-cdl-blue hover:underline"
        >
          /admin/podium
        </a>
        .
      </p>
    </div>
  );
}
