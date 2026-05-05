import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getAdminTenantOuNull } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({
  instagram_page_access_token: z.string().trim().min(1).max(2000).nullable().optional(),
  instagram_business_account_id: z
    .string()
    .trim()
    .regex(/^\d{6,30}$/, "ID precisa ter só dígitos")
    .nullable()
    .optional(),
  instagram_facebook_page_id: z
    .string()
    .trim()
    .regex(/^\d{6,30}$/, "ID precisa ter só dígitos")
    .nullable()
    .optional(),
  instagram_username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._]{1,30}$/, "Username Instagram inválido")
    .nullable()
    .optional(),
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
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const upd: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) upd[k] = v;
  }
  if (Object.keys(upd).length === 0) {
    return NextResponse.json({ ok: true, sem_alteracao: true });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("tenants")
    .update(upd)
    .eq("id", tenant.id);

  if (error) {
    return NextResponse.json(
      { error: `Falha: ${error.message}` },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
