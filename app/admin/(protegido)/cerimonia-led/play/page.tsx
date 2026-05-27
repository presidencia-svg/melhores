import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { PlayerLed, type SlidePlayer } from "./PlayerLed";

export const dynamic = "force-dynamic";

export default async function CerimoniaLedPlay() {
  const tenant = await getCurrentTenant();
  const supabase = createSupabaseAdminClient();
  const [{ data }, edicaoStatus] = await Promise.all([
    supabase
      .from("cerimonia_slides")
      .select("id, ordem, empresa, recebe, instagram, logo_url")
      .eq("tenant_id", tenant.id)
      .order("ordem", { ascending: true }),
    getEdicaoStatus(tenant.id),
  ]);

  const slides = (data ?? []) as SlidePlayer[];
  if (slides.length === 0) {
    redirect("/admin/cerimonia-led");
  }

  const ano =
    edicaoStatus.status !== "sem_edicao" ? edicaoStatus.edicao.ano : new Date().getFullYear();

  return (
    <PlayerLed
      slides={slides}
      ano={ano}
      tenantNome={tenant.nome}
      logoTenant={tenant.logo_url}
    />
  );
}
