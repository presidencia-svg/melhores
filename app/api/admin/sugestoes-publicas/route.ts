import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";

const Body = z.object({ ligadas: z.boolean() });

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const tenant = await getCurrentTenant();
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("app_config")
    .select("valor")
    .eq("tenant_id", tenant.id)
    .eq("chave", "sugestoes_publicas")
    .maybeSingle();
  return NextResponse.json({
    ligadas: (data?.valor ?? "ligadas") !== "desligadas",
  });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const tenant = await getCurrentTenant();
  const supabase = createSupabaseAdminClient();
  await supabase.from("app_config").upsert(
    {
      tenant_id: tenant.id,
      chave: "sugestoes_publicas",
      valor: parsed.data.ligadas ? "ligadas" : "desligadas",
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "tenant_id,chave" }
  );
  return NextResponse.json({ ok: true, ligadas: parsed.data.ligadas });
}
