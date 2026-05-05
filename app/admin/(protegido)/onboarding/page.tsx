import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { CheckCircle2, Circle } from "lucide-react";
import {
  EdicaoStep,
  MetaStep,
  InstagramStep,
  ConcluirStep,
} from "./Wizard";

export const dynamic = "force-dynamic";

type StepKey = "edicao" | "meta" | "instagram" | "concluir";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: StepKey }>;
}) {
  const tenant = await getCurrentTenant();
  const status = await getEdicaoStatus(tenant.id);
  const temEdicao = status.status !== "sem_edicao";
  const temMeta = Boolean(tenant.meta_phone_number_id);
  const temInstagram = Boolean(tenant.instagram_page_access_token);

  const sp = await searchParams;
  let step: StepKey = sp.step ?? "edicao";

  // Step 1 e' obrigatorio. Se ainda nao tem edicao e tentou pular, volta.
  if (!temEdicao && step !== "edicao") step = "edicao";

  // Se ja completou tudo, redireciona pro dashboard.
  if (temEdicao && temMeta && temInstagram && step === "concluir") {
    redirect("/admin");
  }

  const passos: { key: StepKey; titulo: string; feito: boolean }[] = [
    { key: "edicao", titulo: "Edição", feito: temEdicao },
    { key: "meta", titulo: "WhatsApp", feito: temMeta },
    { key: "instagram", titulo: "Instagram", feito: temInstagram },
    { key: "concluir", titulo: "Concluir", feito: false },
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <header className="mb-6">
        <p className="kicker text-cdl-blue/60 text-xs uppercase tracking-widest mb-2">
          {tenant.nome} · primeira configuração
        </p>
        <h1 className="font-display text-3xl font-bold text-cdl-blue">
          Vamos preparar sua plataforma
        </h1>
        <p className="text-muted mt-1">
          Quatro passos rápidos pra deixar tudo pronto antes de abrir as
          votações.
        </p>
      </header>

      {/* Stepper visual */}
      <ol className="flex items-center gap-2 mb-6 overflow-x-auto">
        {passos.map((p, i) => {
          const ativo = p.key === step;
          return (
            <li
              key={p.key}
              className={`flex items-center gap-2 text-sm shrink-0 ${
                ativo
                  ? "text-cdl-blue font-bold"
                  : p.feito
                  ? "text-cdl-green-dark"
                  : "text-muted"
              }`}
            >
              {p.feito ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
              <span>
                {i + 1}. {p.titulo}
              </span>
              {i < passos.length - 1 ? (
                <span className="text-zinc-300 mx-1">—</span>
              ) : null}
            </li>
          );
        })}
      </ol>

      <Card>
        <CardContent>
          {step === "edicao" && (
            <EdicaoStep
              edicaoExistente={
                temEdicao
                  ? {
                      ano: status.edicao.ano,
                      nome: status.edicao.nome,
                    }
                  : null
              }
              tenantNome={tenant.nome}
            />
          )}
          {step === "meta" && (
            <MetaStep
              valoresAtuais={{
                meta_phone_number_id: tenant.meta_phone_number_id,
                meta_template_otp: tenant.meta_template_otp,
                meta_template_incentivo: tenant.meta_template_incentivo,
                meta_template_incentivo_empate:
                  tenant.meta_template_incentivo_empate,
                meta_template_parcial: tenant.meta_template_parcial,
                meta_template_lang: tenant.meta_template_lang,
              }}
            />
          )}
          {step === "instagram" && (
            <InstagramStep
              valoresAtuais={{
                instagram_page_access_token:
                  tenant.instagram_page_access_token,
                instagram_business_account_id:
                  tenant.instagram_business_account_id,
                instagram_facebook_page_id:
                  tenant.instagram_facebook_page_id,
                instagram_username: tenant.instagram_username,
              }}
            />
          )}
          {step === "concluir" && (
            <ConcluirStep
              temMeta={temMeta}
              temInstagram={temInstagram}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
