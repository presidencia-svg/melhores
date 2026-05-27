import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { Tv, Play } from "lucide-react";
import { SlidesManager, type SlideRow } from "./SlidesManager";

export const dynamic = "force-dynamic";

export default async function CerimoniaLedPage() {
  const tenant = await getCurrentTenant();
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("cerimonia_slides")
    .select("id, ordem, empresa, recebe, instagram, logo_url")
    .eq("tenant_id", tenant.id)
    .order("ordem", { ascending: true });

  const slides = (data ?? []) as SlideRow[];

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
            <SlidesManager slides={[]} tenantNome={tenant.nome} />
          </CardContent>
        </Card>
      ) : (
        <SlidesManager slides={slides} tenantNome={tenant.nome} />
      )}
    </div>
  );
}
