import { redirect } from "next/navigation";
import { VotoLayout } from "@/components/voto/VotoLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { ShieldCheck, Lock } from "lucide-react";
import { CpfForm } from "./CpfForm";
import { getVotanteSessao } from "@/lib/sessao";

export default async function VotarPage() {
  const sessao = await getVotanteSessao();
  if (sessao) {
    if (!sessao.selfie_url) redirect("/votar/selfie");
    redirect("/votar/categorias");
  }

  return (
    <VotoLayout step={1}>
      <div className="mx-auto max-w-md w-full animate-fade-in">
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl font-bold text-cdl-blue mb-2">
            Vamos começar
          </h1>
          <p className="text-muted">
            Informe seu CPF para entrar na votação
          </p>
        </div>

        <Card>
          <CardContent>
            <CpfForm />
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col gap-2 text-sm text-muted">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-cdl-green shrink-0 mt-0.5" />
            <span>Seu CPF é usado apenas para garantir um voto único por pessoa.</span>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-cdl-green shrink-0 mt-0.5" />
            <span>Dados protegidos. Não compartilhamos com terceiros.</span>
          </div>
        </div>
      </div>
    </VotoLayout>
  );
}
