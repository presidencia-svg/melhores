import type { Metadata } from "next";
import { Fraunces, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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

// Bumping ?v= força browsers a re-fetch o favicon (cache agressivo)
const ICON_VERSION = "6";

export const metadata: Metadata = {
  title: "Melhores do Ano CDL Aracaju 2025",
  description:
    "Os Melhores de Aracaju são escolhidos por você. Vote agora — leva 3 minutos.",
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
    title: "Melhores do Ano CDL Aracaju 2025",
    description: "Sua opinião decide os melhores de Aracaju.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${sora.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
