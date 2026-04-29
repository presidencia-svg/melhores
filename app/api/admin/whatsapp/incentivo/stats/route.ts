import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Stats acumuladas do incentivo (ja_receberam = lifetime, nao reinicia
// como a parcial). Le da view v_incentivo_stats.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("v_incentivo_stats")
    .select("ja_receberam, enviadas_hoje, ultima_enviada")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: `Falha ao carregar stats: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    ja_receberam: data?.ja_receberam ?? 0,
    enviadas_hoje: data?.enviadas_hoje ?? 0,
    ultima_enviada: data?.ultima_enviada ?? null,
  });
}
