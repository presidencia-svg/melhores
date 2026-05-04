"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Server action chamada pelo botao "Atualizar" pra forcar refresh do cache
// de uma rota especifica. Sem isso, mudancas no banco so apareceriam quando
// o revalidate (1h) expirasse.
//
// Se a rota tem materialized view associada (ex: /admin/resultados usa
// v_resultados_riscado), tambem dispara REFRESH MATERIALIZED VIEW antes —
// senao o cache e' invalidado mas os dados continuam stale ate o proximo
// refresh manual.
export async function revalidarRota(path: string) {
  if (!(await isAdmin())) {
    throw new Error("Não autorizado");
  }

  // Materialized views por rota
  const supabase = createSupabaseAdminClient();
  if (path === "/admin/resultados") {
    const { error } = await supabase.rpc("refresh_resultados_riscado");
    if (error) console.error("[revalidar] refresh resultados falhou:", error);
  }

  revalidatePath(path);
  return { ok: true, revalidatedAt: new Date().toISOString() };
}
