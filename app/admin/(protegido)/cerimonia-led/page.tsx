import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { Tv, Play } from "lucide-react";
import { ordenarPorCategoria } from "@/lib/cerimonia/ordenar";
import { SlidesManager, type SlideRow, type CatOption } from "./SlidesManager";

export const dynamic = "force-dynamic";

export default async function CerimoniaLedPage() {
  const tenant = await getCurrentTenant();
  const status = await getEdicaoStatus(tenant.id);
  const edicaoId = status.status !== "sem_edicao" ? status.edicao.id : null;
  const supabase = createSupabaseAdminClient();

  const [{ data }, { data: subcatList }] = await Promise.all([
    supabase
      .from("cerimonia_slides")
      .select(
        "id, ordem, empresa, recebe, instagram, logo_url, categoria, subcategoria"
      )
      .eq("tenant_id", tenant.id)
      .order("ordem", { ascending: true }),
    edicaoId
      ? supabase
          .from("subcategorias")
          .select("nome, categoria:categorias(nome)")
          .eq("edicao_id", edicaoId)
          .order("nome", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  // Ordena por categoria → subcategoria → empresa pra bater com a ordem
  // de execucao do /play (sem categoria vai pro final).
  const slides = ordenarPorCategoria((data ?? []) as SlideRow[]);

  type SubRow = {
    nome: string;
    categoria: { nome: string } | { nome: string }[] | null;
  };
  const catOptions: CatOption[] = ((subcatList ?? []) as SubRow[]).map((r) => {
    const cat = Array.isArray(r.categoria) ? r.categoria[0] : r.categoria;
    return {
      categoria: cat?.nome ?? "—",
      subcategoria: r.nome,
    };
  });

  return (
    <div className="p-8 max-w-5xl">
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-cdl-blue flex items-center gap-3">
            <Tv className="w-7 h-7 text-cdl-blue/70" />
            Cerimônia no LED
          </h1>
          <p className="text-muted mt-1 max-w-2xl">
            Importe a planilha de empresas premiadas e suba as logos. Depois
            abra a apresentação em fullscreen num monitor 2048×768 (ou grave
            com OBS) pra gerar o vídeo do painel LED.
          </p>
        </div>
        {slides.length > 0 && (
          <Link
            href="/admin/cerimonia-led/play"
            target="_blank"
            className="h-11 px-5 inline-flex items-center gap-2 rounded-md bg-cdl-blue text-white font-medium hover:bg-cdl-blue-dark"
          >
            <Play className="w-4 h-4" />
            Iniciar apresentação
          </Link>
        )}
      </header>

      {slides.length === 0 ? (
        <Card>
          <CardContent>
            <h2 className="font-display text-lg font-bold text-cdl-blue mb-2">
              1. Importe a planilha
            </h2>
            <p className="text-sm text-muted mb-4">
              Excel com colunas <code>EMPRESA</code>,{" "}
              <code>QUEM VAI RECEBER O PREMIO</code> e{" "}
              <code>@ DO INSTAGRAM</code>. Cada linha vira um slide.
            </p>
            <SlidesManager slides={[]} tenantNome={tenant.nome} catOptions={catOptions} />
          </CardContent>
        </Card>
      ) : (
        <SlidesManager
          slides={slides}
          tenantNome={tenant.nome}
          catOptions={catOptions}
        />
      )}
    </div>
  );
}
