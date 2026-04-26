import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { EventLogo } from "@/components/brand/EventLogo";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  ShieldCheck,
  UserCheck,
  Camera,
  Award,
  MessageCircle,
  Trophy,
  Lock,
  Clock,
  Users,
  ArrowLeft,
} from "lucide-react";

export const metadata = {
  title: "Como funciona — Melhores do Ano CDL Aracaju 2025",
  description: "Saiba como participar da votação dos Melhores do Ano CDL Aracaju 2025.",
};

export default function RegulamentoPage() {
  return (
    <div className="flex flex-col flex-1 min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/">
            <Logo />
          </Link>
          <Link
            href="/votar"
            className="text-sm font-semibold text-cdl-blue hover:text-cdl-blue-dark"
          >
            Quero votar →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-cdl-hero text-white py-16">
        <div className="mx-auto max-w-3xl px-4 text-center animate-fade-in">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
            Como funciona o prêmio
          </h1>
          <p className="text-lg text-white/80 mt-4">
            Tudo que você precisa saber pra participar dos Melhores do Ano CDL Aracaju 2025.
          </p>
        </div>
      </section>

      {/* Etapas */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="font-display text-3xl font-bold text-cdl-blue mb-8 text-center">
            5 passos pra participar
          </h2>

          <div className="flex flex-col gap-4">
            <Step
              n={1}
              icon={<UserCheck className="w-5 h-5" />}
              title="Identifique-se com seu CPF"
              text="Você informa seu CPF e o sistema confirma seus dados na base oficial. Isso garante 1 voto único por pessoa."
            />
            <Step
              n={2}
              icon={<Camera className="w-5 h-5" />}
              title="Tire uma selfie rápida"
              text="A foto é registrada apenas para validação interna da participação. Não é exibida publicamente em nenhum momento."
            />
            <Step
              n={3}
              icon={<Award className="w-5 h-5" />}
              title="Vote nas categorias que conhece"
              text="Você escolhe quantas e quais categorias quer votar. Não é obrigatório votar em todas — vote só nas que faz sentido pra você."
            />
            <Step
              n={4}
              icon={<MessageCircle className="w-5 h-5" />}
              title="Receba os campeões em primeira mão (opcional)"
              text="Quer saber quem ganhou antes de todo mundo? Deixe seu WhatsApp e validamos com um código de 6 dígitos."
            />
            <Step
              n={5}
              icon={<Trophy className="w-5 h-5" />}
              title="Pronto! Seu voto faz a diferença"
              text="A apuração é automática e os vencedores são anunciados em evento promovido pela CDL Aracaju."
            />
          </div>
        </div>
      </section>

      {/* Garantias */}
      <section className="bg-cdl-blue/5 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="font-display text-3xl font-bold text-cdl-blue mb-8 text-center">
            Segurança e transparência
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Garantia
              icon={<ShieldCheck className="w-6 h-6" />}
              title="1 CPF = 1 voto por categoria"
              text="Validação oficial garante que cada pessoa vota uma única vez em cada categoria."
            />
            <Garantia
              icon={<Lock className="w-6 h-6" />}
              title="Dados protegidos"
              text="Seu CPF é armazenado de forma criptografada (hash). Não compartilhamos com terceiros."
            />
            <Garantia
              icon={<Clock className="w-6 h-6" />}
              title="Apuração em tempo real"
              text="Os votos são contados automaticamente na hora. Sem intermediário, sem manipulação."
            />
            <Garantia
              icon={<Users className="w-6 h-6" />}
              title="Aberto a todos de Aracaju"
              text="Qualquer pessoa com CPF válido pode participar — gratuito e online."
            />
          </div>
        </div>
      </section>

      {/* Perguntas */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="font-display text-3xl font-bold text-cdl-blue mb-8 text-center">
            Perguntas frequentes
          </h2>

          <div className="flex flex-col gap-4">
            <FAQ q="Preciso votar em todas as categorias?">
              Não. Você pode votar apenas nas categorias que conhece e pular as demais. Cada voto é independente.
            </FAQ>
            <FAQ q="E se meu candidato favorito não estiver na lista?">
              Você pode sugerir o nome dele. Se já existir alguém parecido, agrupamos automaticamente. Caso contrário, o candidato é incluído imediatamente para receber votos.
            </FAQ>
            <FAQ q="Por que precisam do meu CPF e da selfie?">
              CPF garante que cada pessoa vota apenas uma vez. A selfie é um registro interno de participação para evitar fraudes (não é exibida publicamente).
            </FAQ>
            <FAQ q="Posso votar do celular?">
              Sim. O sistema é 100% otimizado para celular, tablet e computador.
            </FAQ>
            <FAQ q="Como vou saber dos resultados?">
              Os campeões serão anunciados em evento oficial da CDL Aracaju. Se você optar por receber em primeira mão no WhatsApp, te avisamos antes do anúncio público.
            </FAQ>
            <FAQ q="A votação tem custo?">
              Zero. Participação 100% gratuita.
            </FAQ>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-cdl-blue/5 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <EventLogo className="mb-6" />
          <p className="text-muted mb-6">
            Agora que você sabe como funciona, é hora de votar.
          </p>
          <Link href="/votar">
            <Button size="lg" variant="secondary" className="font-bold">
              Começar minha votação →
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-cdl-blue-dark text-white/80 py-8 mt-auto">
        <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo variant="white" className="text-white" />
          <p className="text-sm text-white/60">
            © 2026 CDL Aracaju · Câmara de Dirigentes Lojistas de Aracaju
          </p>
        </div>
      </footer>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  text,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4">
        <div className="shrink-0 flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-cdl-blue text-white font-bold flex items-center justify-center">
            {n}
          </div>
          <div className="text-cdl-green">{icon}</div>
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-cdl-blue mb-1">{title}</h3>
          <p className="text-muted">{text}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Garantia({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-cdl-green/10 text-cdl-green flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-cdl-blue mb-1">{title}</h3>
            <p className="text-sm text-muted">{text}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="rounded-xl border border-border bg-white overflow-hidden group">
      <summary className="flex items-center justify-between cursor-pointer px-5 py-4 font-semibold text-foreground hover:bg-cdl-blue/5 transition-colors">
        {q}
        <span className="text-cdl-blue text-xl group-open:rotate-45 transition-transform">+</span>
      </summary>
      <div className="px-5 pb-4 text-muted">{children}</div>
    </details>
  );
}
