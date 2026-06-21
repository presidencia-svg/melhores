import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminTenantOuNull } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const PatchBody = z.object({
  nome: z.string().trim().min(2).max(120).optional(),
  logo_url: z.string().url().optional(),
  link: z.string().url().nullable().optional(),
  nivel: z.enum(["patrocinio", "apoio"]).optional(),
  ordem: z.number().int().min(0).max(9999).optional(),
  ativo: z.boolean().optional(),
});

// Cross-tenant guard via edicao!inner(tenant_id)
async function pertenceAoTenant(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  id: string,
  tenantId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("patrocinadores")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return !!data;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenant = await getAdminTenantOuNull();
  if (!tenant) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const supabase = createSupabaseAdminClient();
  if (!(await pertenceAoTenant(supabase, id, tenant.id))) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { error } = await supabase
    .from("patrocinadores")
    .update(parsed.data)
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenant = await getAdminTenantOuNull();
  if (!tenant) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const supabase = createSupabaseAdminClient();
  if (!(await pertenceAoTenant(supabase, id, tenant.id))) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const { error } = await supabase.from("patrocinadores").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
