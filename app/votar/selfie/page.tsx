import { redirect } from "next/navigation";
import { VotoLayout } from "@/components/voto/VotoLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { getVotanteSessao } from "@/lib/sessao";
import { SelfieCapture } from "./SelfieCapture";

export default async function SelfiePage() {
  const sessao = await getVotanteSessao();
  if (!sessao) redirect("/votar");
  if (sessao.selfie_url) redirect("/votar/categorias");

  const primeiroNome = sessao.nome.split(" ")[0] ?? "votante";

  return (
    <VotoLayout step={2}>
      <div className="mx-auto max-w-md w-full animate-fade-in">
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl font-bold text-cdl-blue mb-2">
            Olá, {primeiroNome}! 👋
          </h1>
          <p className="text-muted">
            Tire uma selfie rápida para validar sua participação
          </p>
        </div>

        <Card>
          <CardContent>
            <SelfieCapture />
          </CardContent>
        </Card>

        <p className="text-xs text-muted text-center mt-4">
          A foto é usada apenas para registro de votação e não é exibida publicamente.
        </p>
      </div>
    </VotoLayout>
  );
}
