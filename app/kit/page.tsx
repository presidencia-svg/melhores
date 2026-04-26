import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Card, CardContent } from "@/components/ui/Card";
import { Download, ArrowLeft } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { SmallCaps } from "@/components/brand/Marks";

export const metadata = {
  title: "Kit de Mídia — Melhores do Ano CDL Aracaju 2025",
  description: "Imagens e textos prontos para divulgação.",
  robots: "noindex, nofollow",
};

const WHATSAPP_TEXTS = {
  associadas: `🏆 MELHORES DO ANO CDL ARACAJU 2025

A CDL Aracaju lançou a votação oficial dos Melhores do Ano 2025 e a sua participação faz toda a diferença!

✅ Vote em mais de 80 categorias
✅ É 100% online e gratuito
✅ Leva apenas 3 minutos

🌐 Acesse: https://votar.cdlaju.com.br

Compartilhe com seus amigos e clientes!`,

  geral: `🏆 VOTE NOS MELHORES DE ARACAJU!

Já estão abertas as votações dos Melhores do Ano CDL Aracaju 2025!

Restaurantes, médicos, lojas, escolas, profissionais e muito mais — você decide os destaques da nossa cidade.

🌐 https://votar.cdlaju.com.br

⏱️ Leva 3 minutos · 🔒 Seguro · 🎯 Gratuito`,

  apos_voto: `🏆 Eu acabei de votar nos Melhores do Ano CDL Aracaju 2025!

Vote você também e ajude a escolher os destaques da nossa cidade.

🌐 https://votar.cdlaju.com.br`,
};

export default function KitMidiaPage() {
  return (
    <div className="min-h-screen bg-cream-300">
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
          style={{ fontSize: "clamp(40px, 7vw, 64px)", lineHeight: 1, fontWeight: 300 }}
        >
          Kit de <span className="font-display-bold">mídia.</span>
        </h1>
        <p className="text-muted mt-3 max-w-2xl">
          Imagens prontas e textos pré-formatados para divulgação nas redes sociais,
          grupos de WhatsApp, materiais impressos e cerimônia.
        </p>

        {/* Redes sociais */}
        <Section titulo="Redes sociais">
          <div className="grid md:grid-cols-3 gap-4">
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
        </Section>

        {/* Web e marketing */}
        <Section titulo="Web e e-mail">
          <div className="grid md:grid-cols-2 gap-4">
            <ImagemCard
              src="/api/img/banner"
              label="Banner horizontal"
              spec="1920 × 600"
              uso="Topo de site · capa de e-mail · LinkedIn"
              filename="banner-web.png"
              wide
            />
            <ImagemCard
              src="/opengraph-image"
              label="Compartilhamento (OG)"
              spec="1200 × 630"
              uso="WhatsApp · Twitter · Facebook · link preview"
              filename="og-share.png"
              wide
            />
          </div>
        </Section>

        {/* Convite & cerimônia */}
        <Section titulo="Convite e cerimônia">
          <div className="grid md:grid-cols-2 gap-4">
            <ImagemCard
              src="/api/img/convite"
              label="Convite digital"
              spec="1080 × 1350"
              uso="Convite para a cerimônia de premiação"
              filename="convite-cerimonia.png"
              tall
            />
            <ImagemCard
              src="/api/img/cerimonia"
              label="Telão de premiação"
              spec="1920 × 1080"
              uso="Tela de anúncio do vencedor (Full HD)"
              filename="cerimonia-telao.png"
              wide
            />
          </div>
        </Section>

        {/* Logos */}
        <Section titulo="Logos e ícones">
          <div className="grid md:grid-cols-3 gap-4">
            <LogoCard
              src="/cdl-logo.png"
              label="Logo CDL · cor"
              spec="PNG · transparente"
              uso="Para fundos claros (cream, branco)"
              filename="cdl-logo.png"
            />
            <LogoCard
              src="/cdl-logo-white.png"
              label="Logo CDL · branca"
              spec="PNG · transparente"
              uso="Para fundos escuros (navy, preto)"
              filename="cdl-logo-white.png"
              dark
            />
            <LogoCard
              src="/icon.png"
              label="Favicon · escudo"
              spec="512 × 512 · PNG"
              uso="Ícone do site, redes sociais"
              filename="cdl-favicon.png"
            />
          </div>
        </Section>

        {/* WhatsApp */}
        <Section titulo="Textos para WhatsApp">
          <div className="grid md:grid-cols-3 gap-4">
            <TextoCard titulo="Para grupos de associadas" texto={WHATSAPP_TEXTS.associadas} />
            <TextoCard titulo="Divulgação geral" texto={WHATSAPP_TEXTS.geral} />
            <TextoCard titulo="Após votar (pós-engajamento)" texto={WHATSAPP_TEXTS.apos_voto} />
          </div>
        </Section>

        {/* Documentos */}
        <Section titulo="Documentos para imprensa">
          <div className="grid md:grid-cols-2 gap-4">
            <DocCard
              href="/imprensa/release.md"
              filename="release-melhores-cdl-aracaju.md"
              titulo="Release principal"
              descricao="Release jornalístico completo com lead, citação da presidência, segurança, cronograma e contatos. Pronto para envio à imprensa local e regional."
            />
            <DocCard
              href="/imprensa/release-curto.md"
              filename="release-curto.md"
              titulo="Release curto"
              descricao="Versão condensada para rádio, boletim de TV, stories de Instagram, status de WhatsApp e listas de transmissão. Inclui frases prontas em diferentes tamanhos."
            />
            <DocCard
              href="/imprensa/perguntas-respostas.md"
              filename="perguntas-respostas.md"
              titulo="Q&A para entrevistas"
              descricao="12 perguntas mais prováveis da imprensa sobre fraude, LGPD, custos, prazos. Respostas curtas, prontas para a presidência usar em entrevistas."
            />
            <DocCard
              href="/imprensa/whatsapp.md"
              filename="whatsapp-templates.md"
              titulo="Templates de WhatsApp"
              descricao="7 templates de mensagem para diferentes públicos: associadas, geral, influenciadores, listas de transmissão, lembretes, anúncio dos vencedores."
            />
          </div>
        </Section>

        <Section titulo="Identidade visual completa">
          <Card>
            <CardContent>
              <p className="text-sm text-muted mb-3">
                Sistema visual completo (paleta, tipografia, marcas, princípios) está em:
              </p>
              <Link
                href="/identidade-visual/"
                target="_blank"
                className="inline-flex items-center gap-2 text-sm font-semibold text-navy-800 hover:text-gold-700"
              >
                <Download className="w-4 h-4" />
                Abrir /identidade-visual/
              </Link>
            </CardContent>
          </Card>
        </Section>
      </div>
    </div>
  );
}

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-display-bold text-navy-800 mb-6" style={{ fontSize: 28 }}>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function ImagemCard({
  src,
  label,
  spec,
  uso,
  filename,
  tall,
  wide,
}: {
  src: string;
  label: string;
  spec: string;
  uso: string;
  filename: string;
  tall?: boolean;
  wide?: boolean;
}) {
  const aspect = tall ? "aspect-[9/16]" : wide ? "aspect-[16/9]" : "aspect-square";
  return (
    <Card>
      <CardContent>
        <div
          className={`w-full ${aspect} rounded-sm overflow-hidden bg-navy-900 mb-4 ring-1 ring-[rgba(10,42,94,0.1)]`}
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

function LogoCard({
  src,
  label,
  spec,
  uso,
  filename,
  dark,
}: {
  src: string;
  label: string;
  spec: string;
  uso: string;
  filename: string;
  dark?: boolean;
}) {
  return (
    <Card>
      <CardContent>
        <div
          className={`w-full aspect-square rounded-sm overflow-hidden mb-4 flex items-center justify-center p-8 ${
            dark ? "bg-navy-900" : "bg-cream-200"
          } ring-1 ring-[rgba(10,42,94,0.1)]`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={label} className="max-w-full max-h-full object-contain" />
        </div>
        <SmallCaps color="var(--gold-700)" size={10}>
          {spec}
        </SmallCaps>
        <h3 className="font-display-bold text-navy-800 mt-1 mb-1" style={{ fontSize: 20 }}>
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

function DocCard({
  href,
  filename,
  titulo,
  descricao,
}: {
  href: string;
  filename: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <Card>
      <CardContent>
        <SmallCaps color="var(--gold-700)" size={10}>
          documento
        </SmallCaps>
        <h3 className="font-display-bold text-navy-800 mt-1 mb-2" style={{ fontSize: 22 }}>
          {titulo}
        </h3>
        <p className="text-xs text-muted mb-4 leading-relaxed">{descricao}</p>
        <div className="flex gap-3">
          <a
            href={href}
            download={filename}
            className="inline-flex items-center gap-2 text-sm font-semibold text-navy-800 hover:text-gold-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar
          </a>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-navy-800 transition-colors"
          >
            Visualizar →
          </a>
        </div>
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
        <h3 className="font-display-bold text-navy-800 mt-1 mb-3" style={{ fontSize: 18 }}>
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
