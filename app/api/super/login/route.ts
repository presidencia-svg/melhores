import { NextResponse } from "next/server";
import { z } from "zod";
import { senhaSuperCorreta, setSuperSession } from "@/lib/super-admin/auth";
import { getClientIp } from "@/lib/utils";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({ senha: z.string().min(1) });

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const ip = getClientIp(req.headers);
  const supabase = createSupabaseAdminClient();

  // Rate limit super-admin login: 3 tentativas / 30 min
  const trintaMin = new Date(Date.now() - 30 * 60_000).toISOString();
  const { count } = await supabase
    .from("rate_limit_ip")
    .select("*", { head: true, count: "exact" })
    .eq("ip", ip)
    .eq("acao", "super_login")
    .gte("criado_em", trintaMin);

  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde 30 minutos." },
      { status: 429 }
    );
  }

  if (!senhaSuperCorreta(parsed.data.senha)) {
    await supabase.from("rate_limit_ip").insert({ ip, acao: "super_login" });
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  await setSuperSession();
  return NextResponse.json({ ok: true });
}
