import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Aceita ligado e/ou cap_dia — um, outro ou os dois.
const Body = z
  .object({
    ligado: z.boolean().optional(),
    cap_dia: z.number().int().min(0).max(10000).optional(),
  })
  .refine((b) => b.ligado !== undefined || b.cap_dia !== undefined, {
    message: "Informe ligado e/ou cap_dia",
  });

const CAP_DIA_DEFAULT = 1200;

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const supabase = createSupabaseAdminClient();

  const umaHoraAtras = new Date(Date.now() - 60 * 60_000).toISOString();
  const umDiaAtras = new Date(Date.now() - 24 * 60 * 60_000).toISOString();

  const [
    { data: cfgs },
    { count: hora },
    { count: dia },
    { data: stats },
  ] = await Promise.all([
    supabase
      .from("app_config")
      .select("chave, valor")
      .in("chave", ["auto_parcial", "auto_parcial_cap_dia"]),
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

  const map = new Map((cfgs ?? []).map((c) => [c.chave, c.valor]));
  const capDiaRaw = map.get("auto_parcial_cap_dia");
  const capDia = capDiaRaw ? parseInt(capDiaRaw, 10) : CAP_DIA_DEFAULT;

  return NextResponse.json({
    ligado: (map.get("auto_parcial") ?? "off") === "on",
    cap_dia: Number.isFinite(capDia) ? capDia : CAP_DIA_DEFAULT,
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
  const agora = new Date().toISOString();

  const upserts: { chave: string; valor: string; atualizado_em: string }[] = [];
  if (parsed.data.ligado !== undefined) {
    upserts.push({
      chave: "auto_parcial",
      valor: parsed.data.ligado ? "on" : "off",
      atualizado_em: agora,
    });
  }
  if (parsed.data.cap_dia !== undefined) {
    upserts.push({
      chave: "auto_parcial_cap_dia",
      valor: String(parsed.data.cap_dia),
      atualizado_em: agora,
    });
  }

  if (upserts.length > 0) {
    await supabase.from("app_config").upsert(upserts);
  }

  return NextResponse.json({ ok: true });
}
