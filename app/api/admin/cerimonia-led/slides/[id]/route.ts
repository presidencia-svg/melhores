import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const PatchBody = z.object({
  empresa: z.string().trim().min(1).max(200).optional(),
  recebe: z.string().trim().max(200).nullable().optional(),
  instagram: z.string().trim().max(200).nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
  ordem: z.number().int().min(0).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const tenant = await getCurrentTenant();
  const { id } = await params;

  const json = await req.json().catch(() => ({}));
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("cerimonia_slides")
    .update({ ...parsed.data, atualizado_em: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const tenant = await getCurrentTenant();
  const { id } = await params;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("cerimonia_slides")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
