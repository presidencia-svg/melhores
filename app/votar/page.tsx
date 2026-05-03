import { redirect } from "next/navigation";
import { VotoLayout } from "@/components/voto/VotoLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { ShieldCheck, Lock, RotateCcw } from "lucide-react";
import { CpfForm } from "./CpfForm";
import { getVotanteSessao } from "@/lib/sessao";
import { getSpcMode } from "@/lib/spc/mode";
import { SmallCaps } from "@/components/brand/Marks";

export default async function VotarPage() {
  const sessao = await getVotanteSessao();
  if (sessao) {
    if (!sessao.selfie_url) redirect("/votar/selfie");
    redirect("/votar/categorias");
  }

  const spcMode = await getSpcMode();

  return (
    <VotoLayout step={1}>
      <div className="mx-auto max-w-md w-full pt-4 sm:pt-8 animate-fade-in">
        <div className="text-center mb-6 sm:mb-8">
          <SmallCaps color="var(--gold-700)" size={11}>
            passo 01 · identificação
          </SmallCaps>
          <h1
            className="font-display text-navy-800 mt-3"
            style={{ fontSize: "clamp(40px, 10vw, 56px)", lineHeight: 1, fontWeight: 300 }}
          >
            Vamos <span className="font-display-bold">começar.</span>
          </h1>
          <p className="text-muted mt-3 text-sm">
            Informe seu CPF para entrar na votação oficial.
          </p>
        </div>

        <div className="mb-4 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <RotateCcw className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-[13px] leading-snug text-amber-900">
            <strong>Já votou antes?</strong> É só digitar seu CPF aqui embaixo
            e continuar de onde parou. Seus votos anteriores ficam preservados
            — você vota só nas categorias que ainda faltam.
          </p>
        </div>

        <Card>
          <CardContent>
            <CpfForm spcDesligado={spcMode === "desligado"} />
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
