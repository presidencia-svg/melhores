import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { EventLogo } from "@/components/brand/EventLogo";
import { Button } from "@/components/ui/Button";
import { Award, Users, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo />
          <Link
            href="/admin/login"
            className="text-sm text-muted hover:text-cdl-blue transition-colors"
          >
            Admin
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-cdl-hero text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="flex flex-col items-center text-center gap-8 animate-fade-in">
            <span className="rounded-full bg-cdl-yellow/20 border border-cdl-yellow/30 px-4 py-1.5 text-sm font-semibold text-cdl-yellow">
              ⭐ Edição 2026 — Aberta para votação
            </span>

            <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl">
              Os <span className="text-cdl-yellow">Melhores</span> de Aracaju são escolhidos por você.
            </h1>

            <p className="text-lg md:text-xl text-white/80 max-w-2xl">
              Participe do prêmio Melhores do Ano CDL Aracaju 2026.
              Vote nas categorias que você acha relevantes — leva menos de 3 minutos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Link href="/votar">
                <Button size="lg" className="bg-cdl-yellow text-cdl-blue-dark hover:bg-cdl-yellow-dark border-0 font-bold">
                  Quero votar agora →
                </Button>
              </Link>
              <Link href="/regulamento">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-cdl-blue">
                  Como funciona
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-cdl-blue mb-3">
              Simples, rápido e seguro
            </h2>
            <p className="text-muted text-lg">Em 3 passos você participa</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Step
              num={1}
              icon={<ShieldCheck className="w-6 h-6" />}
              title="Identifique-se"
              text="Informe seu CPF e tire uma selfie. Garantimos um voto por pessoa, com total segurança."
            />
            <Step
              num={2}
              icon={<Award className="w-6 h-6" />}
              title="Escolha as categorias"
              text="Vote apenas nas categorias que você conhece. Não é obrigatório votar em todas."
            />
            <Step
              num={3}
              icon={<Users className="w-6 h-6" />}
              title="Receba os campeões"
              text="Quer saber em primeira mão quem ganhou? Deixe seu WhatsApp e seja avisado."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cdl-blue/5 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <EventLogo className="mb-6" />
          <p className="text-muted mb-6">
            A votação encerra em breve. Garanta sua participação.
          </p>
          <Link href="/votar">
            <Button size="lg" variant="secondary" className="font-bold">
              Começar votação
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-cdl-blue-dark text-white/80 py-8">
        <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo variant="white" className="text-white" />
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-white/60">
            <Link href="/regulamento" className="hover:text-white">Como funciona</Link>
            <Link href="/termos" className="hover:text-white">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
            <span>© 2026 CDL Aracaju</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Step({ num, icon, title, text }: { num: number; icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col items-start p-6 rounded-2xl border border-border bg-white hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cdl-blue text-white font-bold">
          {num}
        </div>
        <div className="text-cdl-green">{icon}</div>
      </div>
      <h3 className="font-display text-xl font-bold text-cdl-blue mb-2">{title}</h3>
      <p className="text-muted">{text}</p>
    </div>
  );
}
