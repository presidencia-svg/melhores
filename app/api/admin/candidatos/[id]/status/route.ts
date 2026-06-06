import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminTenantOuNull } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({
  status: z.enum(["aprovado", "rejeitado", "pendente", "duplicado"]),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenant = await getAdminTenantOuNull();
  if (!tenant) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const supabase = createSupabaseAdminClient();

  // Cross-tenant guard: candidato precisa ser do tenant logado.
  const { data: scope } = await supabase
    .from("candidatos")
    .select("id, edicao!inner(tenant_id)")
    .eq("id", id)
    .eq("edicao.tenant_id", tenant.id)
    .maybeSingle();
  if (!scope) {
    return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });
  }

  const { error } = await supabase.from("candidatos").update({ status: parsed.data.status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
