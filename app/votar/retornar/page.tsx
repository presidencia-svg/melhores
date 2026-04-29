import { redirect } from "next/navigation";
import { VotoLayout } from "@/components/voto/VotoLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Lock, ShieldCheck } from "lucide-react";
import { SmallCaps } from "@/components/brand/Marks";
import { getPreRetorno, getVotanteSessao } from "@/lib/sessao";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { mascararWhatsapp } from "@/lib/utils";
import { RetornarForm } from "./RetornarForm";

export default async function RetornarPage() {
  // Se ja tem sessao completa, manda direto pra votar
  const sessao = await getVotanteSessao();
  if (sessao) {
    redirect("/votar/categorias");
  }

  // Sem cookie de pre-retorno => fluxo errado, manda pra inicio
  const votanteId = await getPreRetorno();
  if (!votanteId) {
    redirect("/votar");
  }

  const supabase = createSupabaseAdminClient();
  const { data: votante } = await supabase
    .from("votantes")
    .select("nome, whatsapp")
    .eq("id", votanteId)
    .maybeSingle();

  if (!votante || !votante.whatsapp) {
    redirect("/votar");
  }

  const primeiroNome = (votante.nome ?? "").split(" ")[0] || "amigo(a)";
  const whatsappMascarado = mascararWhatsapp(votante.whatsapp);

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
            Você já participou. Vamos confirmar seu acesso pra você votar nas
            categorias que ainda faltam.
          </p>
        </div>

        <Card>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-xs text-muted mb-1">Vamos enviar um código no WhatsApp</p>
              <p className="font-mono text-base font-semibold text-cdl-blue">
                {whatsappMascarado}
              </p>
              <p className="text-[11px] text-muted mt-2">
                O número é o mesmo do seu cadastro original.<br />
                Por segurança, não pode ser alterado aqui.
              </p>
            </div>

            <RetornarForm />
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col gap-2 text-xs text-muted">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
            <span>
              Você só vai poder votar nas categorias que ainda não votou. As
              que já votou ficam bloqueadas — não dá pra alterar.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
            <span>
              Se você perdeu acesso ao WhatsApp cadastrado, fale com a CDL
              Aracaju.
            </span>
          </div>
        </div>
      </div>
    </VotoLayout>
  );
}
