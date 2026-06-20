import { Card, CardContent } from "@/components/ui/Card";
import { Heart } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { listarPatrocinadores } from "@/lib/patrocinadores";
import { PatrocinadoresAdmin } from "./PatrocinadoresAdmin";

export const dynamic = "force-dynamic";

export default async function PatrocinadoresPage() {
  const tenant = await getCurrentTenant();
  const status = await getEdicaoStatus(tenant.id);
  if (status.status === "sem_edicao") {
    return (
      <div className="p-8 text-red-600">
        Crie uma edição ativa primeiro em /admin/edicoes.
      </div>
    );
  }

  const lista = await listarPatrocinadores(status.edicao.id);

  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cdl-blue flex items-center gap-3">
          <Heart className="w-8 h-8 text-rose-500" />
          Patrocinadores
        </h1>
        <p className="text-muted mt-1 text-sm leading-relaxed">
          Quem apoia a edição <strong>{status.edicao.nome}</strong>. Aparecem
          em ordem por nível: <em>Master → Ouro → Prata → Bronze → Apoio</em>.
          O tamanho do logo na home varia conforme o nível.
        </p>
      </header>

      <Card>
        <CardContent>
          <PatrocinadoresAdmin patrocinadores={lista} />
        </CardContent>
      </Card>

      <p className="text-xs text-muted mt-6">
        Patrocinadores aparecem em: <strong>Home (/)</strong> entre as seções
        principais · <strong>Rodapé global</strong> · Slide dedicado na{" "}
        <strong>Cerimônia LED</strong> (em breve).
      </p>
    </div>
  );
}
