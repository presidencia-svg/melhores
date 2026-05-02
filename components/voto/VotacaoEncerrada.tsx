import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { SmallCaps, Divider } from "@/components/brand/Marks";
import { Trophy } from "lucide-react";

type Props = {
  fimVotacao: string;
  nomeEdicao: string;
};

// Pagina mostrada em qualquer URL de /votar quando a votacao ja encerrou.
// fim_votacao da edicao ativa e o controle.
export function VotacaoEncerrada({ fimVotacao, nomeEdicao }: Props) {
  const fim = new Date(fimVotacao);
  const fimFormatado = fim.toLocaleString("pt-BR", {
    timeZone: "America/Maceio",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-cream-300">
      <header className="border-b border-[rgba(10,42,94,0.12)] bg-cream-100/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-2.5">
          <Link href="/">
            <Logo />
          </Link>
          <SmallCaps color="var(--gold-700)" size={10} className="hidden sm:inline">
            {nomeEdicao}
          </SmallCaps>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-2xl text-center animate-fade-in">
          <div className="mx-auto w-20 h-20 rounded-full bg-cdl-blue/10 flex items-center justify-center mb-6">
            <Trophy className="w-10 h-10 text-cdl-blue" />
          </div>

          <SmallCaps color="var(--gold-700)" size={11}>
            Melhores do Ano · CDL Aracaju
          </SmallCaps>

          <h1
            className="font-display text-navy-800 mt-3"
            style={{ fontSize: "clamp(36px, 9vw, 64px)", lineHeight: 1, fontWeight: 300 }}
          >
            A votação está{" "}
            <span className="font-display-bold">encerrada.</span>
          </h1>

          <div className="mt-6 inline-flex items-center gap-3 text-navy-800">
            <Divider width={32} color="var(--gold-500)" />
            <span className="font-display italic" style={{ fontSize: 18 }}>
              encerrou em {fimFormatado}
            </span>
            <Divider width={32} color="var(--gold-500)" />
          </div>

          <p className="text-muted mt-8 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Obrigado a todos que participaram. Em breve divulgaremos os melhores de Aracaju eleitos por você.
          </p>

          <p className="text-muted mt-6 text-sm">
            Acompanhe as novidades em{" "}
            <a
              href="https://www.cdlaju.com.br"
              target="_blank"
              rel="noreferrer"
              className="text-cdl-blue underline hover:text-cdl-blue-dark font-medium"
            >
              cdlaju.com.br
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
