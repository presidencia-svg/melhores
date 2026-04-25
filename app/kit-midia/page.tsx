import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Card, CardContent } from "@/components/ui/Card";
import { Download, ArrowLeft } from "lucide-react";
import { CopyButton } from "./CopyButton";

export const metadata = {
  title: "Kit de Mídia — Melhores do Ano CDL Aracaju 2026",
  description: "Imagens e textos prontos para divulgação.",
  robots: "noindex, nofollow",
};

const WHATSAPP_TEXTS = {
  associadas: `🏆 *MELHORES DO ANO CDL ARACAJU 2026*

A CDL Aracaju lançou a votação oficial dos *Melhores do Ano 2026* e a sua participação faz toda a diferença!

✅ Vote em mais de 70 categorias
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

Vote você também e ajude a escolher os destaques da nossa cidade. 🟢🟡🔵

🌐 https://votar.cdlaju.com.br`,
};

export default function KitMidiaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cdl-blue/5 to-background">
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-cdl-blue"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-cdl-blue mb-2">
          Kit de Mídia
        </h1>
        <p className="text-muted mb-8">
          Imagens e textos prontos para divulgação nas redes sociais e grupos de WhatsApp.
        </p>

        {/* Imagens */}
        <h2 className="font-display text-xl font-bold text-cdl-blue mb-4">📸 Imagens</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <ImagemCard
            src="/api/img/feed"
            label="Feed (1080×1080)"
            uso="Instagram Feed, Facebook, LinkedIn"
            filename="melhores-feed.png"
          />
          <ImagemCard
            src="/api/img/story"
            label="Story (1080×1920)"
            uso="Stories Instagram, TikTok, Status WhatsApp"
            filename="melhores-story.png"
            tall
          />
          <ImagemCard
            src="/api/img/eu-votei"
            label='"Eu Votei!" (1080×1080)'
            uso="Para eleitores compartilharem após votar"
            filename="eu-votei.png"
          />
        </div>

        {/* WhatsApp */}
        <h2 className="font-display text-xl font-bold text-cdl-blue mb-4">💬 Textos para WhatsApp</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <TextoCard
            titulo="Para grupos de associadas"
            texto={WHATSAPP_TEXTS.associadas}
          />
          <TextoCard
            titulo="Divulgação geral"
            texto={WHATSAPP_TEXTS.geral}
          />
          <TextoCard
            titulo="Após votar (pós-engajamento)"
            texto={WHATSAPP_TEXTS.apos_voto}
          />
        </div>

        {/* Documentos */}
        <h2 className="font-display text-xl font-bold text-cdl-blue mb-4">📄 Documentos para imprensa</h2>
        <Card>
          <CardContent>
            <p className="text-sm text-muted mb-3">
              Os documentos completos estão na pasta <code className="bg-zinc-100 px-1 rounded">imprensa/</code> do projeto:
            </p>
            <ul className="text-sm space-y-2">
              <li>• <strong>release.md</strong> — Release principal completo</li>
              <li>• <strong>release-curto.md</strong> — Versão para rádio/boletim</li>
              <li>• <strong>perguntas-respostas.md</strong> — Q&A para entrevistas</li>
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
  uso,
  filename,
  tall,
}: {
  src: string;
  label: string;
  uso: string;
  filename: string;
  tall?: boolean;
}) {
  return (
    <Card>
      <CardContent>
        <div
          className={`w-full ${tall ? "aspect-[9/16]" : "aspect-square"} rounded-xl overflow-hidden bg-cdl-blue/10 mb-3`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={label} className="w-full h-full object-cover" />
        </div>
        <h3 className="font-display font-bold text-cdl-blue mb-1">{label}</h3>
        <p className="text-xs text-muted mb-3">{uso}</p>
        <a
          href={src}
          download={filename}
          className="inline-flex items-center gap-2 text-sm font-semibold text-cdl-blue hover:text-cdl-blue-dark"
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
        <h3 className="font-display font-bold text-cdl-blue mb-3">{titulo}</h3>
        <pre className="text-xs text-foreground bg-zinc-50 rounded-lg p-3 mb-3 whitespace-pre-wrap break-words font-sans max-h-64 overflow-y-auto">
{texto}
        </pre>
        <CopyButton text={texto} />
      </CardContent>
    </Card>
  );
}

