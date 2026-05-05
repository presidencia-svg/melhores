import { Newspaper } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/Card";
import { ImprensaLista, type LinhaTop6, type NumerosCampanha } from "./ImprensaLista";
import { AtualizarBtn } from "../AtualizarBtn";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { montarBranding } from "@/lib/tenant/branding";

// 1h: pos-eleicao a lista e' imutavel. Botao "Atualizar" no header invalida
// o cache na hora caso precise (ex: depois de mesclar candidatos via SQL).
export const revalidate = 3600;

export default async function ImprensaPage() {
  const tenant = await getCurrentTenant();
  const edicaoStatus = await getEdicaoStatus(tenant.id);
  const edicao =
    edicaoStatus.status !== "sem_edicao" ? edicaoStatus.edicao : null;
  const branding = montarBranding(tenant, edicao);
  const supabase = createSupabaseAdminClient();

  // Pagina sem truncamento — pega tudo (sao ~600 linhas: 102 subs * 6).
  const PAGE_SIZE = 1000;
  const linhas: LinhaTop6[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data } = await supabase
      .from("v_top6_por_sub")
      .select("*")
      .range(offset, offset + PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    linhas.push(...(data as LinhaTop6[]));
    if (data.length < PAGE_SIZE) break;
  }

  // Numeros da campanha (1 linha) — pra secao de transparencia
  const { data: numerosRow } = await supabase
    .from("v_numeros_campanha")
    .select("*")
    .maybeSingle();
  const numeros = (numerosRow ?? null) as NumerosCampanha | null;

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-cdl-blue flex items-center gap-2">
            <Newspaper className="w-7 h-7 text-cdl-green" />
            Lista pra imprensa
          </h1>
          <p className="text-muted mt-1">
            Top 6 colocados de cada subcategoria, com votos. Use a aba pra
            alternar entre agrupado por categoria ou ordem alfabética. Copie
            ou baixe como .txt pra mandar no email.
          </p>
        </div>
        <AtualizarBtn path="/admin/imprensa" />
      </header>

      {linhas.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted py-12 text-center">
              Sem dados de votação ainda. Rode a migration 029 no Supabase se
              ainda não rodou.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ImprensaLista linhas={linhas} numeros={numeros} branding={branding} />
      )}
    </div>
  );
}
