import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getAdminTenantOuNull } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Wizard step "WhatsApp": tenant escolhe se quer validar votantes por OTP
// no WhatsApp ou nao. Envio em si sempre passa pelo numero do super admin
// (META_WHATSAPP_PHONE_IDS env), entao nao pedimos Phone Number ID nem
// templates pro tenant.
const Body = z.object({
  validacao: z.boolean(),
});

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const tenant = await getAdminTenantOuNull();
  if (!tenant) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const agora = new Date().toISOString();
  await supabase.from("app_config").upsert(
    [
      {
        tenant_id: tenant.id,
        chave: "whatsapp_validacao",
        valor: parsed.data.validacao ? "ligada" : "desligada",
        atualizado_em: agora,
      },
      {
        tenant_id: tenant.id,
        chave: "onboarding_whatsapp",
        valor: "feito",
        atualizado_em: agora,
      },
    ],
    { onConflict: "tenant_id,chave" }
  );

  return NextResponse.json({ ok: true });
}
