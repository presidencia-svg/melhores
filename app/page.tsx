import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { TrophyMark, LaurelHalf, SmallCaps, Divider } from "@/components/brand/Marks";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <header className="border-b border-[rgba(10,42,94,0.12)] bg-cream-100/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">
          <Logo />
          <div className="flex items-center gap-4 sm:gap-5 text-sm text-navy-800/60">
            <Link href="/regulamento" className="hover:text-navy-800 hidden sm:inline">
              Como funciona
            </Link>
            <Link
              href="/admin/login"
              className="kicker text-navy-800/40 hover:text-navy-800"
              style={{ fontSize: 9 }}
            >
              admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden gradient-cdl-hero text-cream-100">
        <div className="grain" />
        {/* laurel decorations */}
        <div className="absolute left-0 bottom-0 opacity-15 hidden lg:block">
          <LaurelHalf size={220} color="#d4a537" />
        </div>
        <div className="absolute right-0 top-12 opacity-15 hidden lg:block">
          <LaurelHalf size={220} color="#d4a537" flip />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-24 md:py-32">
          <div className="flex flex-col items-center text-center gap-5 sm:gap-6 animate-fade-in">
            <SmallCaps color="#d4a537" size={11}>
              cdl aracaju · edição 2025
            </SmallCaps>

            <h1 className="font-display text-cream-100 max-w-4xl text-balance">
              <span
                style={{
                  fontSize: "clamp(40px, 11vw, 96px)",
                  lineHeight: 0.95,
                  fontWeight: 300,
                  display: "block",
                }}
              >
                Os melhores
              </span>
              <span
                className="text-gold-400 block"
                style={{
                  fontSize: "clamp(56px, 14vw, 132px)",
                  lineHeight: 0.85,
                  fontWeight: 800,
                }}
              >
                de Aracaju
              </span>
            </h1>

            <div className="flex items-center gap-3 sm:gap-4 text-cream-100/80">
              <Divider width={20} color="#d4a537" />
              <span
                className="font-display italic"
                style={{ fontSize: "clamp(15px, 4vw, 22px)", fontWeight: 400 }}
              >
                são escolhidos por você
              </span>
              <Divider width={20} color="#d4a537" />
            </div>

            <p className="max-w-xl text-cream-100/75 text-sm sm:text-base md:text-lg leading-relaxed mt-2 px-2">
              A votação oficial está aberta. Vote nas categorias que você conhece —
              leva menos de três minutos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6 w-full sm:w-auto">
              <Link href="/votar" className="w-full sm:w-auto">
                <Button variant="gold" size="lg" className="w-full sm:w-auto px-8 sm:px-10">
                  Quero votar agora
                </Button>
              </Link>
              <Link href="/regulamento" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-cream-100/40 text-cream-100 hover:bg-cream-100 hover:text-navy-800"
                >
                  Como funciona
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-cream-100 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <SmallCaps color="var(--gold-700)" size={11}>
              participação
            </SmallCaps>
            <h2
              className="font-display text-navy-800 mt-3"
              style={{ fontSize: "clamp(30px, 7vw, 56px)", lineHeight: 1, fontWeight: 300 }}
            >
              Simples, rápido <span className="font-display-bold">e seguro.</span>
            </h2>
            <p className="text-muted text-sm sm:text-base mt-4 max-w-md mx-auto">
              Em três passos você participa do prêmio mais tradicional do comércio sergipano.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 sm:gap-10">
            <Step
              num="01"
              title="Identifique-se"
              text="Informe seu CPF e tire uma selfie. Garantimos um voto único por pessoa, com validação oficial."
            />
            <Step
              num="02"
              title="Escolha as categorias"
              text="Vote apenas nas que você conhece. São 88 subcategorias em 10 áreas — não precisa votar em todas."
            />
            <Step
              num="03"
              title="Receba os campeões"
              text="Quer saber em primeira mão quem ganhou? Deixe seu WhatsApp e seja avisado antes do anúncio público."
            />
          </div>
        </div>
      </section>

      {/* CTA editorial */}
      <section className="bg-cream-200 py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="grain" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-5 sm:mb-6">
            <TrophyMark size={56} color="var(--navy-800)" />
          </div>

          <SmallCaps color="var(--gold-700)" size={11}>
            edição 2025 · aberta para votação
          </SmallCaps>

          <h2
            className="font-display text-navy-800 mt-3 sm:mt-4 text-balance"
            style={{ fontSize: "clamp(30px, 7vw, 56px)", lineHeight: 1, fontWeight: 300 }}
          >
            Você decide quem
            <br />
            <span className="font-display-bold">faz a diferença</span>
            <br />
            em Aracaju.
          </h2>

          <div className="mt-6 sm:mt-8 flex justify-center">
            <Link href="/votar" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 sm:px-10">
                Começar votação
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted mt-6 font-mono">votar.cdlaju.com.br</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-900 text-cream-100/70 py-8 mt-auto">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col md:grid md:grid-cols-3 gap-5 items-center text-center md:text-left">
          <div className="flex justify-center md:justify-start">
            <Logo variant="white" />
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
            <Link href="/regulamento" className="hover:text-cream-100">Como funciona</Link>
            <Link href="/termos" className="hover:text-cream-100">Termos</Link>
            <Link href="/privacidade" className="hover:text-cream-100">Privacidade</Link>
          </div>
          <p className="text-xs text-cream-100/50 font-mono md:text-right">
            © 2026 CDL Aracaju
          </p>
        </div>
      </footer>
    </div>
  );
}

function Step({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <div className="flex flex-col items-start text-left">
      <div className="flex items-baseline gap-3 mb-3">
        <span
          className="font-display-bold text-gold-500"
          style={{ fontSize: "clamp(40px, 8vw, 56px)", lineHeight: 1 }}
        >
          {num}
        </span>
        <Divider width={28} color="var(--navy-800)" />
      </div>
      <h3
        className="font-display-bold text-navy-800 mb-2"
        style={{ fontSize: "clamp(22px, 5vw, 28px)", lineHeight: 1.05 }}
      >
        {title}
      </h3>
      <p className="text-muted text-sm leading-relaxed">{text}</p>
    </div>
  );
}
