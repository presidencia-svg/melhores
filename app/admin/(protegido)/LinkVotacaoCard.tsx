"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Share2, Copy, Check, MessageSquare } from "lucide-react";

export function LinkVotacaoCard({
  url,
  edicaoNome,
}: {
  url: string;
  edicaoNome: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // ignora
    }
  }

  const mensagemWhatsApp =
    `Vote no *${edicaoNome}*! ` +
    `Sua opinião escolhe os destaques do ano. ` +
    `É rápido — leva menos de 3 minutos:\n\n${url}`;

  const linkWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensagemWhatsApp)}`;

  return (
    <Card className="mb-6 border-cdl-blue/30 bg-gradient-to-br from-cdl-blue/5 to-cdl-green/5">
      <CardContent>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-cdl-blue/15 text-cdl-blue flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display-bold text-navy-800 text-base leading-tight">
              Link da votação
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Compartilhe nas redes, WhatsApp, e-mail e site da instituição.
              Quanto mais divulgação, mais votos.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <code className="flex-1 min-w-0 truncate font-mono text-sm bg-white border border-border rounded-md px-3 py-2.5 text-cdl-blue">
            {url}
          </code>
          <button
            onClick={copiar}
            className={`h-11 px-4 inline-flex items-center justify-center gap-2 rounded-md font-medium text-sm transition-colors ${
              copiado
                ? "bg-cdl-green text-white"
                : "bg-cdl-blue text-white hover:bg-cdl-blue-dark"
            }`}
          >
            {copiado ? (
              <>
                <Check className="w-4 h-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar link
              </>
            )}
          </button>
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener"
            className="h-11 px-4 inline-flex items-center justify-center gap-2 rounded-md font-medium text-sm bg-cdl-green text-white hover:bg-cdl-green-dark"
          >
            <MessageSquare className="w-4 h-4" />
            Enviar no WhatsApp
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
