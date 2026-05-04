"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin/auth";

// Server action chamada pelo botao "Atualizar" pra forcar refresh do cache
// de uma rota especifica. Sem isso, mudancas no banco so apareceriam quando
// o revalidate (1h) expirasse.
export async function revalidarRota(path: string) {
  if (!(await isAdmin())) {
    throw new Error("Não autorizado");
  }
  revalidatePath(path);
  return { ok: true, revalidatedAt: new Date().toISOString() };
}
