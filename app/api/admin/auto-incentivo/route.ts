import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";

const Body = z.object({ ligado: z.boolean() });

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const tenant = await getCurrentTenant();
  const supabase = createSupabaseAdminClient();

  const umaHoraAtras = new Date(Date.now() - 60 * 60_000).toISOString();
  const umDiaAtras = new Date(Date.now() - 24 * 60 * 60_000).toISOString();

  const [{ data: cfg }, { count: hora }, { count: dia }, { count: autoDia }] =
    await Promise.all([
      supabase
        .from("app_config")
        .select("valor")
        .eq("tenant_id", tenant.id)
        .eq("chave", "auto_incentivo_empate")
        .maybeSingle(),
      supabase
        .from("incentivo_envios_log")
        .select("*", { head: true, count: "exact" })
        .gte("criado_em", umaHoraAtras),
      supabase
        .from("incentivo_envios_log")
        .select("*", { head: true, count: "exact" })
        .gte("criado_em", umDiaAtras),
      supabase
        .from("incentivo_envios_log")
        .select("*", { head: true, count: "exact" })
        .gte("criado_em", umDiaAtras)
        .eq("motivo", "auto_empate"),
    ]);

  return NextResponse.json({
    ligado: (cfg?.valor ?? "on") === "on",
    envios: { hora: hora ?? 0, dia: dia ?? 0, auto_dia: autoDia ?? 0 },
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
      chave: "auto_incentivo_empate",
      valor: parsed.data.ligado ? "on" : "off",
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "tenant_id,chave" }
  );
  return NextResponse.json({ ok: true, ligado: parsed.data.ligado });
}
