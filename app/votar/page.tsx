import { redirect } from "next/navigation";
import { VotoLayout } from "@/components/voto/VotoLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { ShieldCheck, Lock } from "lucide-react";
import { CpfForm } from "./CpfForm";
import { getVotanteSessao } from "@/lib/sessao";
import { SmallCaps } from "@/components/brand/Marks";

export default async function VotarPage() {
  const sessao = await getVotanteSessao();
  if (sessao) {
    if (!sessao.selfie_url) redirect("/votar/selfie");
    redirect("/votar/categorias");
  }

  return (
    <VotoLayout step={1}>
      <div className="mx-auto max-w-md w-full pt-8 animate-fade-in">
        <div className="text-center mb-8">
          <SmallCaps color="var(--gold-700)" size={11}>
            passo 01 · identificação
          </SmallCaps>
          <h1 className="font-display text-navy-800 mt-3" style={{ fontSize: 56, lineHeight: 1, fontWeight: 300 }}>
            Vamos <span className="font-display-bold">começar.</span>
          </h1>
          <p className="text-muted mt-3 text-sm">
            Informe seu CPF para entrar na votação oficial.
          </p>
        </div>

        <Card>
          <CardContent>
            <CpfForm />
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col gap-2 text-xs text-muted">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
            <span>Seu CPF é usado apenas para garantir um voto único por pessoa.</span>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
            <span>Dados protegidos. Não compartilhamos com terceiros.</span>
          </div>
        </div>
      </div>
    </VotoLayout>
  );
}
