import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminTenantOuNull } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getModoSugestoes, type ModoSugestoes } from "@/lib/sugestoes/mode";

const Body = z.object({
  modo: z.enum(["livre", "aprovacao", "desligadas"]),
});

export async function GET() {
  const tenant = await getAdminTenantOuNull();
  if (!tenant) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const modo = await getModoSugestoes(tenant.id);
  return NextResponse.json({ modo });
}

export async function POST(req: Request) {
  const tenant = await getAdminTenantOuNull();
  if (!tenant) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const modo: ModoSugestoes = parsed.data.modo;
  const supabase = createSupabaseAdminClient();
  await supabase.from("app_config").upsert(
    {
      tenant_id: tenant.id,
      chave: "sugestoes_publicas",
      valor: modo,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "tenant_id,chave" }
  );
  return NextResponse.json({ ok: true, modo });
}
