import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { TesteOtpForm } from "./TesteOtpForm";

export const dynamic = "force-dynamic";

export default function TesteOtpPage() {
  return (
    <div className="p-8 max-w-2xl">
      <Link
        href="/admin/whatsapp"
        className="text-sm text-cdl-blue hover:underline inline-flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cdl-blue flex items-center gap-3">
          <MessageSquare className="w-8 h-8" />
          Testar OTP do WhatsApp
        </h1>
        <p className="text-muted mt-1 text-sm leading-relaxed">
          Envia um código de validação real pelo template{" "}
          <code className="bg-zinc-100 px-1 rounded">codigo_verificacao</code>
          {" "}pro número informado. Use seu próprio WhatsApp pra confirmar que
          a integração Meta está chegando. <strong>Não cobra do saldo</strong>
          {" "}— é uso interno de diagnóstico.
        </p>
      </header>

      <Card>
        <CardContent>
          <TesteOtpForm />
        </CardContent>
      </Card>
    </div>
  );
}
