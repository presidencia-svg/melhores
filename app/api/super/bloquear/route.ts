import { NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin } from "@/lib/super-admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({
  tenant_id: z.string().uuid(),
  ativo: z.boolean(),
});

export async function POST(req: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("tenants")
    .update({ ativo: parsed.data.ativo })
    .eq("id", parsed.data.tenant_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
