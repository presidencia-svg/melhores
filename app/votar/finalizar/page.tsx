import { redirect } from "next/navigation";
import Link from "next/link";
import { VotoLayout } from "@/components/voto/VotoLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Trophy, MessageCircle, ArrowLeft } from "lucide-react";
import { getVotanteSessao } from "@/lib/sessao";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { WhatsAppForm } from "./WhatsAppForm";

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
      <div className="mx-auto max-w-md w-full animate-fade-in">
        <Link
          href="/votar/categorias"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-cdl-blue mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Continuar votando
        </Link>

        <Card>
          <CardContent className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-cdl-yellow/20 flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-cdl-yellow-dark" />
            </div>
            <h1 className="font-display text-2xl font-bold text-cdl-blue mb-1">
              Quase lá!
            </h1>
            <p className="text-muted mb-2">
              Você registrou <strong className="text-cdl-blue">{totalVotos}</strong> {totalVotos === 1 ? "voto" : "votos"}.
            </p>
            <p className="text-sm text-muted">Antes de finalizar, uma última pergunta…</p>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-cdl-green/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-cdl-green" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-cdl-blue">
                  Saiba os campeões em primeira mão
                </h2>
                <p className="text-sm text-muted">
                  Receba no WhatsApp os vencedores antes do anúncio público. Opcional.
                </p>
              </div>
            </div>

            <WhatsAppForm whatsappAtual={sessao.whatsapp} />
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/votar/obrigado">
            <Button variant="ghost">Pular e finalizar →</Button>
          </Link>
        </div>
      </div>
    </VotoLayout>
  );
}
