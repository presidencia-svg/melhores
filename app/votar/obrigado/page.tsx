import { redirect } from "next/navigation";
import Link from "next/link";
import { VotoLayout } from "@/components/voto/VotoLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Share2 } from "lucide-react";
import { getVotanteSessao } from "@/lib/sessao";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { TrophyMark, SmallCaps, Divider, LaurelHalf } from "@/components/brand/Marks";

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
      <div className="mx-auto max-w-md w-full pt-4 sm:pt-8 animate-fade-in">
        <Card className="relative overflow-hidden">
          <div className="absolute -left-4 top-0 opacity-10">
            <LaurelHalf size={120} color="var(--navy-800)" />
          </div>
          <div className="absolute -right-4 top-0 opacity-10">
            <LaurelHalf size={120} color="var(--navy-800)" flip />
          </div>
          <CardContent className="text-center relative">
            <div className="flex justify-center mb-3">
              <TrophyMark size={64} color="var(--gold-500)" />
            </div>
            <SmallCaps color="var(--gold-700)" size={11}>
              voto registrado
            </SmallCaps>
            <h1
              className="font-display text-navy-800 mt-2"
              style={{ fontSize: 40, lineHeight: 1, fontWeight: 300 }}
            >
              Obrigado,
            </h1>
            <div
              className="font-display-bold text-navy-800"
              style={{ fontSize: 56, lineHeight: 1, fontWeight: 800 }}
            >
              {primeiroNome}.
            </div>
            <div className="mt-5 flex justify-center">
              <Divider width={48} color="var(--gold-500)" />
            </div>

            <p className="text-muted text-sm mt-5 leading-relaxed">
              Seu voto faz parte do prêmio
              <br />
              <strong className="text-navy-800 font-display italic">Melhores do Ano CDL Aracaju 2025</strong>.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/15 border border-gold-500/30">
              <span
                className="font-display-bold text-navy-800"
                style={{ fontSize: 16 }}
              >
                {totalVotos}
              </span>
              <span className="kicker text-navy-800" style={{ fontSize: 9 }}>
                {totalVotos === 1 ? "voto registrado" : "votos registrados"}
              </span>
            </div>

            {whatsappOk && (
              <p className="mt-4 text-xs text-green-600 font-medium">
                ✓ Você receberá os campeões em primeira mão no WhatsApp.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-navy-800/10 flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5 text-navy-800" />
              </div>
              <div className="flex-1">
                <SmallCaps color="var(--gold-700)" size={10}>
                  divulgue
                </SmallCaps>
                <h2
                  className="font-display-bold text-navy-800 mt-1"
                  style={{ fontSize: 20, lineHeight: 1.1 }}
                >
                  Convide quem mora em Aracaju.
                </h2>
                <p className="text-xs text-muted mt-1">
                  Quanto mais gente votando, mais legítimo o resultado.
                </p>
                <ShareButton />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="ghost">Voltar ao início</Button>
          </Link>
        </div>
      </div>
    </VotoLayout>
  );
}

function ShareButton() {
  const url = "https://votar.cdlaju.com.br";
  const text = `Vote nos Melhores do Ano CDL Aracaju 2025! 🏆\n${url}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  return (
    <a
      href={wa}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex h-10 items-center gap-2 rounded-sm bg-green-600 text-cream-100 px-4 font-medium hover:bg-green-600/90 transition-colors text-sm"
    >
      Compartilhar no WhatsApp
    </a>
  );
}
