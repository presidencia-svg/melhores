import { Card, CardContent } from "@/components/ui/Card";
import { Palette } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { MarcaForm } from "./MarcaForm";

export const dynamic = "force-dynamic";

export default async function MarcaPage() {
  const tenant = await getCurrentTenant();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cdl-blue flex items-center gap-3">
          <Palette className="w-7 h-7 text-cdl-green" />
          Marca da instituição
        </h1>
        <p className="text-muted mt-1">
          O logo aparece no painel, na página pública de votação, nos
          certificados e nos cards do Instagram.
        </p>
      </header>

      <Card>
        <CardContent>
          <MarcaForm
            nomeAtual={tenant.nome}
            logoAtual={tenant.logo_url}
            corPrimariaAtual={tenant.cor_primaria}
            corSecundariaAtual={tenant.cor_secundaria}
            assinaturaNomeAtual={tenant.assinatura_nome}
            assinaturaCargoAtual={tenant.assinatura_cargo}
          />
        </CardContent>
      </Card>

      <p className="text-xs text-muted mt-4">
        Dica: use PNG ou SVG com fundo transparente, no mínimo 400×400px. O
        logo fica melhor se for quadrado ou levemente horizontal.
      </p>
    </div>
  );
}
