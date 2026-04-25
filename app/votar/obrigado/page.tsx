import { redirect } from "next/navigation";
import Link from "next/link";
import { VotoLayout } from "@/components/voto/VotoLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Trophy, Share2 } from "lucide-react";
import { getVotanteSessao } from "@/lib/sessao";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export default async function ObrigadoPage() {
  const sessao = await getVotanteSessao();
  if (!sessao) redirect("/votar");

  const supabase = createSupabaseAdminClient();
  const { count } = await supabase
    .from("votos")
    .select("*", { head: true, count: "exact" })
    .eq("votante_id", sessao.id);

  const totalVotos = count ?? 0;
  const primeiroNome = sessao.nome.split(" ")[0] ?? "";
  const whatsappOk = sessao.whatsapp_validado;

  return (
    <VotoLayout step={4}>
      <div className="mx-auto max-w-md w-full animate-fade-in">
        <Card>
          <CardContent className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-cdl-green/15 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-cdl-green" />
            </div>
            <h1 className="font-display text-3xl font-bold text-cdl-blue mb-2">
              Obrigado, {primeiroNome}! 🎉
            </h1>
            <p className="text-muted">
              Seu voto foi registrado e faz parte do prêmio
              <strong className="text-cdl-blue"> Melhores do Ano CDL Aracaju 2026</strong>.
            </p>

            <div className="mt-6 flex items-center justify-center gap-2 rounded-full bg-cdl-yellow/15 border border-cdl-yellow/30 px-4 py-2">
              <Trophy className="w-4 h-4 text-cdl-yellow-dark" />
              <span className="text-sm font-semibold text-cdl-blue">
                {totalVotos} {totalVotos === 1 ? "voto registrado" : "votos registrados"}
              </span>
            </div>

            {whatsappOk && (
              <p className="mt-4 text-sm text-cdl-green font-medium">
                ✓ Você receberá os campeões em primeira mão no WhatsApp.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-cdl-blue/10 flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5 text-cdl-blue" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-cdl-blue mb-1">
                  Convide quem mora em Aracaju
                </h2>
                <p className="text-sm text-muted mb-3">
                  Quanto mais gente votando, mais legítimo o resultado.
                </p>
                <ShareButton />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/">
            <Button variant="ghost">Voltar ao início</Button>
          </Link>
        </div>
      </div>
    </VotoLayout>
  );
}

function ShareButton() {
  const url = "https://cdlaju.com";
  const text = `Vote nos Melhores do Ano CDL Aracaju 2026! 🏆\n${url}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  return (
    <a
      href={wa}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-cdl-green text-white px-4 font-semibold hover:bg-cdl-green-dark transition-colors text-sm"
    >
      Compartilhar no WhatsApp
    </a>
  );
}
