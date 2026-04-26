import { redirect } from "next/navigation";
import Link from "next/link";
import { VotoLayout } from "@/components/voto/VotoLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { getVotanteSessao } from "@/lib/sessao";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { WhatsAppForm } from "./WhatsAppForm";
import { SmallCaps, TrophyMark, Divider } from "@/components/brand/Marks";

export default async function FinalizarPage() {
  const sessao = await getVotanteSessao();
  if (!sessao) redirect("/votar");
  if (!sessao.selfie_url) redirect("/votar/selfie");

  const supabase = createSupabaseAdminClient();
  const { count } = await supabase
    .from("votos")
    .select("*", { head: true, count: "exact" })
    .eq("votante_id", sessao.id);

  const totalVotos = count ?? 0;

  return (
    <VotoLayout step={4}>
      <div className="mx-auto max-w-md w-full pt-4 sm:pt-8 animate-fade-in">
        <Link
          href="/votar/categorias"
          className="inline-flex items-center gap-2 text-xs text-muted hover:text-navy-800 mb-4 transition-colors kicker"
          style={{ fontSize: 10 }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          continuar votando
        </Link>

        <Card>
          <CardContent className="text-center">
            <div className="flex justify-center mb-3">
              <TrophyMark size={48} color="var(--gold-500)" />
            </div>
            <SmallCaps color="var(--gold-700)" size={11}>
              quase lá
            </SmallCaps>
            <h1
              className="font-display text-navy-800 mt-2"
              style={{ fontSize: 40, lineHeight: 1, fontWeight: 300 }}
            >
              Você registrou
            </h1>
            <div
              className="font-display-bold text-navy-800"
              style={{ fontSize: 80, lineHeight: 1, fontWeight: 800 }}
            >
              {totalVotos}
            </div>
            <p className="text-muted text-sm mt-2">
              {totalVotos === 1 ? "voto" : "votos"} nas categorias do prêmio.
            </p>

            <div className="mt-4 flex justify-center">
              <Divider width={48} color="var(--gold-500)" />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent>
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-green-600/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <SmallCaps color="var(--gold-700)" size={10}>
                  opcional
                </SmallCaps>
                <h2
                  className="font-display-bold text-navy-800 mt-1"
                  style={{ fontSize: 22, lineHeight: 1.1 }}
                >
                  Saiba os campeões em primeira mão.
                </h2>
                <p className="text-xs text-muted mt-1">
                  Receba no WhatsApp os vencedores antes do anúncio público.
                </p>
              </div>
            </div>

            <WhatsAppForm whatsappAtual={sessao.whatsapp} />
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/votar/obrigado">
            <Button variant="ghost" size="sm">
              Pular e finalizar →
            </Button>
          </Link>
        </div>
      </div>
    </VotoLayout>
  );
}
