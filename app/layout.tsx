import type { Metadata } from "next";
import { Fraunces, Sora, JetBrains_Mono, Pinyon_Script } from "next/font/google";
import "./globals.css";
import { MetaPixel } from "@/components/MetaPixel";
import { tryGetCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["300", "400", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

// Caligrafica usada apenas na assinatura dos certificados de premiacao.
const pinyon = Pinyon_Script({
  variable: "--font-pinyon",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

// Bumping ?v= força browsers a re-fetch o favicon (cache agressivo)
const ICON_VERSION = "6";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await tryGetCurrentTenant();
  let nomeCampanha = "Melhores do Ano";
  let cidadeOuRegiao = "";
  if (tenant) {
    const status = await getEdicaoStatus(tenant.id);
    if (status.status !== "sem_edicao") {
      nomeCampanha = status.edicao.nome;
    } else {
      nomeCampanha = `Melhores do Ano ${tenant.nome}`;
    }
    cidadeOuRegiao = tenant.nome.replace(/^CDL\s+/i, "");
  }

  const description = cidadeOuRegiao
    ? `Os Melhores de ${cidadeOuRegiao} são escolhidos por você. Vote agora — leva 3 minutos.`
    : "A votação é feita por você. Vote agora — leva 3 minutos.";

  const ogDescription = cidadeOuRegiao
    ? `Sua opinião decide os melhores de ${cidadeOuRegiao}.`
    : "Sua opinião decide os melhores.";

  return {
    title: nomeCampanha,
    description,
    icons: {
      icon: [
        { url: `/icon.png?v=${ICON_VERSION}`, sizes: "512x512", type: "image/png" },
        { url: `/icon.png?v=${ICON_VERSION}`, sizes: "32x32", type: "image/png" },
        { url: `/icon.png?v=${ICON_VERSION}`, sizes: "16x16", type: "image/png" },
      ],
      apple: [
        { url: `/apple-icon.png?v=${ICON_VERSION}`, sizes: "180x180", type: "image/png" },
      ],
      shortcut: [`/icon.png?v=${ICON_VERSION}`],
    },
    openGraph: {
      title: nomeCampanha,
      description: ogDescription,
      type: "website",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${sora.variable} ${jetbrains.variable} ${pinyon.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
