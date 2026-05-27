import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { ordenarPorCategoria } from "@/lib/cerimonia/ordenar";
import { PlayerLed, type SlidePlayer } from "./PlayerLed";

export const dynamic = "force-dynamic";

export default async function CerimoniaLedPlay() {
  const tenant = await getCurrentTenant();
  const supabase = createSupabaseAdminClient();
  const [{ data }, edicaoStatus] = await Promise.all([
    supabase
      .from("cerimonia_slides")
      .select(
        "id, ordem, empresa, recebe, instagram, logo_url, categoria, subcategoria"
      )
      .eq("tenant_id", tenant.id)
      .order("ordem", { ascending: true }),
    getEdicaoStatus(tenant.id),
  ]);

  const slidesRaw = (data ?? []) as SlidePlayer[];
  if (slidesRaw.length === 0) {
    redirect("/admin/cerimonia-led");
  }
  // Ordena por categoria → subcategoria → empresa pra cerimonia seguir a
  // sequencia logica que o anunciador vai usar.
  const slides = ordenarPorCategoria(slidesRaw);

  const ano =
    edicaoStatus.status !== "sem_edicao" ? edicaoStatus.edicao.ano : new Date().getFullYear();

  const cidade = tenant.nome.replace(/^CDL\s+/i, "").trim();

  return (
    <PlayerLed
      slides={slides}
      ano={ano}
      tenantNome={tenant.nome}
      logoTenant={tenant.logo_url}
      cidade={cidade}
    />
  );
}
