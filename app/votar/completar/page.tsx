import { redirect } from "next/navigation";
import { VotoLayout } from "@/components/voto/VotoLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { ShieldCheck, MessageCircle } from "lucide-react";
import { SmallCaps } from "@/components/brand/Marks";
import { getVotanteSessao } from "@/lib/sessao";
import { WhatsAppForm } from "../finalizar/WhatsAppForm";

export default async function CompletarPage() {
  const sessao = await getVotanteSessao();
  if (!sessao) redirect("/votar");

  // Se o votante ja validou o WhatsApp, segue direto pra continuar votando.
  if (sessao.whatsapp_validado) redirect("/votar/categorias");

  const primeiroNome = (sessao.nome ?? "").split(" ")[0] || "amigo(a)";

  return (
    <VotoLayout step={1}>
      <div className="mx-auto max-w-md w-full pt-4 sm:pt-8 animate-fade-in">
        <div className="text-center mb-6 sm:mb-8">
          <SmallCaps color="var(--gold-700)" size={11}>
            voltando à votação
          </SmallCaps>
          <h1
            className="font-display text-navy-800 mt-3"
            style={{ fontSize: "clamp(34px, 9vw, 48px)", lineHeight: 1.05, fontWeight: 300 }}
          >
            Olá de novo, <span className="font-display-bold">{primeiroNome}.</span>
          </h1>
          <p className="text-muted mt-3 text-sm">
            Você já se cadastrou, mas o WhatsApp ainda não foi confirmado.
            Confirme agora pra continuar votando nas categorias que faltam.
          </p>
        </div>

        <Card>
          <CardContent>
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-green-600/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <SmallCaps color="var(--gold-700)" size={10}>
                  confirmação
                </SmallCaps>
                <h2
                  className="font-display-bold text-navy-800 mt-1"
                  style={{ fontSize: 22, lineHeight: 1.1 }}
                >
                  Confirme seu WhatsApp.
                </h2>
                <p className="text-xs text-muted mt-1">
                  Enviamos um código de 6 dígitos pra garantir que é você.
                </p>
              </div>
            </div>

            <WhatsAppForm
              whatsappAtual={sessao.whatsapp}
              redirectAfter="/votar/categorias"
            />
          </CardContent>
        </Card>

        <div className="mt-6 text-xs text-muted flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
          <span>
            Você só vai votar nas categorias que ainda não votou. As que já
            votou ficam bloqueadas — não dá pra alterar.
          </span>
        </div>
      </div>
    </VotoLayout>
  );
}
