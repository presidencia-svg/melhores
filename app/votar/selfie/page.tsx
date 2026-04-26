import { redirect } from "next/navigation";
import { VotoLayout } from "@/components/voto/VotoLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { getPreCadastro, getVotanteSessao } from "@/lib/sessao";
import { SelfieCapture } from "./SelfieCapture";
import { SmallCaps } from "@/components/brand/Marks";

export default async function SelfiePage() {
  // Aceita dois estados:
  // 1) sessão já existente (raro: votante voltou após registro completo)
  // 2) pre-cadastro recém-criado em /api/identificar (caminho normal)
  const sessao = await getVotanteSessao();
  if (sessao?.selfie_url) redirect("/votar/categorias");

  const pre = sessao ? null : await getPreCadastro();
  if (!sessao && !pre) redirect("/votar");

  const nome = sessao?.nome ?? pre!.nome;
  const primeiroNome = nome.split(" ")[0] ?? "votante";

  return (
    <VotoLayout step={2}>
      <div className="mx-auto max-w-md w-full pt-4 sm:pt-8 animate-fade-in">
        <div className="text-center mb-6 sm:mb-8">
          <SmallCaps color="var(--gold-700)" size={11}>
            passo 02 · validação ao vivo
          </SmallCaps>
          <h1
            className="font-display text-navy-800 mt-3"
            style={{ fontSize: "clamp(36px, 9vw, 48px)", lineHeight: 1, fontWeight: 300 }}
          >
            Olá, <span className="font-display-bold">{primeiroNome}.</span>
          </h1>
          <p className="text-muted mt-3 text-sm">
            Tire uma selfie rápida para validar sua participação.
          </p>
        </div>

        <Card>
          <CardContent>
            <SelfieCapture />
          </CardContent>
        </Card>

        <p className="text-xs text-muted text-center mt-4 leading-relaxed">
          A foto é registrada apenas para validação interna<br />e não é exibida publicamente.
        </p>
      </div>
    </VotoLayout>
  );
}
