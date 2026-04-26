import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Card, CardContent } from "@/components/ui/Card";
import { Download, ArrowLeft } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { SmallCaps } from "@/components/brand/Marks";

export const metadata = {
  title: "Kit de Mídia — Melhores do Ano CDL Aracaju 2026",
  description: "Imagens e textos prontos para divulgação.",
  robots: "noindex, nofollow",
};

const WHATSAPP_TEXTS = {
  associadas: `🏆 *MELHORES DO ANO CDL ARACAJU 2026*

A CDL Aracaju lançou a votação oficial dos *Melhores do Ano 2026* e a sua participação faz toda a diferença!

✅ Vote em mais de 80 categorias
✅ É 100% online e gratuito
✅ Leva apenas 3 minutos

🌐 Acesse: https://votar.cdlaju.com.br

*Compartilhe com seus amigos e clientes!*`,

  geral: `🏆 *VOTE NOS MELHORES DE ARACAJU!*

Já estão abertas as votações dos *Melhores do Ano CDL Aracaju 2026*!

Restaurantes, médicos, lojas, escolas, profissionais e muito mais — você decide os destaques da nossa cidade.

🌐 https://votar.cdlaju.com.br

⏱️ Leva 3 minutos · 🔒 Seguro · 🎯 Gratuito`,

  apos_voto: `🏆 Eu acabei de votar nos *Melhores do Ano CDL Aracaju 2026*!

Vote você também e ajude a escolher os destaques da nossa cidade.

🌐 https://votar.cdlaju.com.br`,
};

export default function KitMidiaPage() {
  return (
    <div className="min-h-screen bg-cream-300">
      {/* Header */}
      <header className="border-b border-[rgba(10,42,94,0.12)] bg-cream-100/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">
          <Link href="/">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-navy-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
        <SmallCaps color="var(--gold-700)" size={11}>
          divulgação · uso interno
        </SmallCaps>
        <h1
          className="font-display text-navy-800 mt-3"
          style={{
            fontSize: "clamp(40px, 7vw, 64px)",
            lineHeight: 1,
            fontWeight: 300,
          }}
        >
          Kit de <span className="font-display-bold">mídia.</span>
        </h1>
        <p className="text-muted mt-3 max-w-2xl">
          Imagens prontas e textos pré-formatados para divulgação nas redes sociais,
          grupos de WhatsApp e materiais impressos.
        </p>

        {/* Imagens */}
        <h2 className="font-display-bold text-navy-800 mt-12 mb-6" style={{ fontSize: 28 }}>
          Imagens
        </h2>
        <div className="grid md:grid-cols-3 gap-4 mb-14">
          <ImagemCard
            src="/api/img/feed"
            label="Feed"
            spec="1080 × 1080"
            uso="Instagram Feed · Facebook · LinkedIn"
            filename="melhores-feed.png"
          />
          <ImagemCard
            src="/api/img/story"
            label="Story"
            spec="1080 × 1920"
            uso="Stories Instagram · TikTok · Status WhatsApp"
            filename="melhores-story.png"
            tall
          />
          <ImagemCard
            src="/api/img/eu-votei"
            label="Eu Votei!"
            spec="1080 × 1080"
            uso="Para eleitores compartilharem após votar"
            filename="eu-votei.png"
          />
        </div>

        {/* WhatsApp */}
        <h2 className="font-display-bold text-navy-800 mb-6" style={{ fontSize: 28 }}>
          Textos para WhatsApp
        </h2>
        <div className="grid md:grid-cols-3 gap-4 mb-14">
          <TextoCard titulo="Para grupos de associadas" texto={WHATSAPP_TEXTS.associadas} />
          <TextoCard titulo="Divulgação geral" texto={WHATSAPP_TEXTS.geral} />
          <TextoCard titulo="Após votar (pós-engajamento)" texto={WHATSAPP_TEXTS.apos_voto} />
        </div>

        {/* Documentos */}
        <h2 className="font-display-bold text-navy-800 mb-6" style={{ fontSize: 28 }}>
          Documentos para imprensa
        </h2>
        <Card>
          <CardContent>
            <p className="text-sm text-muted mb-3">
              Os documentos completos estão na pasta{" "}
              <code className="bg-cream-200 px-2 py-0.5 rounded text-xs">imprensa/</code> do projeto:
            </p>
            <ul className="text-sm space-y-2 text-foreground">
              <li>
                • <strong>release.md</strong> — Release principal completo
              </li>
              <li>
                • <strong>release-curto.md</strong> — Versão para rádio/boletim
              </li>
              <li>
                • <strong>perguntas-respostas.md</strong> — Q&A para entrevistas
              </li>
              <li>
                • <strong>whatsapp.md</strong> — 7 templates de mensagem
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ImagemCard({
  src,
  label,
  spec,
  uso,
  filename,
  tall,
}: {
  src: string;
  label: string;
  spec: string;
  uso: string;
  filename: string;
  tall?: boolean;
}) {
  return (
    <Card>
      <CardContent>
        <div
          className={`w-full ${
            tall ? "aspect-[9/16]" : "aspect-square"
          } rounded-sm overflow-hidden bg-navy-900 mb-4 ring-1 ring-[rgba(10,42,94,0.1)]`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={label} className="w-full h-full object-cover" />
        </div>
        <SmallCaps color="var(--gold-700)" size={10}>
          {spec}
        </SmallCaps>
        <h3
          className="font-display-bold text-navy-800 mt-1 mb-1"
          style={{ fontSize: 22 }}
        >
          {label}
        </h3>
        <p className="text-xs text-muted mb-4 leading-relaxed">{uso}</p>
        <a
          href={src}
          download={filename}
          className="inline-flex items-center gap-2 text-sm font-semibold text-navy-800 hover:text-gold-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Baixar PNG
        </a>
      </CardContent>
    </Card>
  );
}

function TextoCard({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <Card>
      <CardContent>
        <SmallCaps color="var(--gold-700)" size={10}>
          mensagem
        </SmallCaps>
        <h3
          className="font-display-bold text-navy-800 mt-1 mb-3"
          style={{ fontSize: 18 }}
        >
          {titulo}
        </h3>
        <pre className="text-xs text-foreground bg-cream-200 rounded-sm p-3 mb-3 whitespace-pre-wrap break-words font-sans max-h-64 overflow-y-auto leading-relaxed">
          {texto}
        </pre>
        <CopyButton text={texto} />
      </CardContent>
    </Card>
  );
}
