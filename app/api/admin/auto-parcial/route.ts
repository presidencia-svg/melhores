import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({ ligado: z.boolean() });

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const supabase = createSupabaseAdminClient();

  const umaHoraAtras = new Date(Date.now() - 60 * 60_000).toISOString();
  const umDiaAtras = new Date(Date.now() - 24 * 60 * 60_000).toISOString();

  const [
    { data: cfg },
    { count: hora },
    { count: dia },
    { data: stats },
  ] = await Promise.all([
    supabase
      .from("app_config")
      .select("valor")
      .eq("chave", "auto_parcial")
      .maybeSingle(),
    supabase
      .from("votantes")
      .select("*", { head: true, count: "exact" })
      .gte("parcial_enviada_em", umaHoraAtras),
    supabase
      .from("votantes")
      .select("*", { head: true, count: "exact" })
      .gte("parcial_enviada_em", umDiaAtras),
    supabase
      .from("v_parcial_stats")
      .select("total, ja_receberam, na_fila, enviadas_hoje")
      .maybeSingle(),
  ]);

  return NextResponse.json({
    ligado: (cfg?.valor ?? "off") === "on",
    envios: { hora: hora ?? 0, dia: dia ?? 0 },
    fila: {
      total: stats?.total ?? 0,
      ja_receberam: stats?.ja_receberam ?? 0,
      na_fila: stats?.na_fila ?? 0,
      enviadas_hoje: stats?.enviadas_hoje ?? 0,
    },
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
  const supabase = createSupabaseAdminClient();
  await supabase.from("app_config").upsert({
    chave: "auto_parcial",
    valor: parsed.data.ligado ? "on" : "off",
    atualizado_em: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true, ligado: parsed.data.ligado });
}
