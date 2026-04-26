import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const threshold = Number.parseInt(searchParams.get("threshold") ?? "5", 10);
  const cooldown = Number.parseInt(searchParams.get("cooldown") ?? "30", 10);
  if (Number.isNaN(threshold) || threshold < 0 || threshold > 100) {
    return NextResponse.json({ error: "Threshold inválido (0-100)" }, { status: 400 });
  }
  if (Number.isNaN(cooldown) || cooldown < 0 || cooldown > 1440) {
    return NextResponse.json({ error: "Cooldown inválido (0-1440 min)" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("incentivo_elegives", {
    p_threshold: threshold,
    p_min_minutos_apos_voto: cooldown,
  });

  if (error) {
    return NextResponse.json(
      { error: `Falha ao calcular elegíveis: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, threshold, cooldown, elegiveis: data ?? [] });
}
