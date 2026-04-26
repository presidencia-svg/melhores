import { NextResponse } from "next/server";
import { z } from "zod";
import { senhaCorreta, setAdminSession } from "@/lib/admin/auth";
import { isTotpEnabled, verifyTotpCode } from "@/lib/admin/totp";
import { getClientIp } from "@/lib/utils";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({
  senha: z.string().min(1),
  codigo: z.string().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const ip = getClientIp(req.headers);
  const supabase = createSupabaseAdminClient();

  // Rate limit: 5 tentativas por IP em 15min
  const quinzeMin = new Date(Date.now() - 15 * 60_000).toISOString();
  const { count } = await supabase
    .from("rate_limit_ip")
    .select("*", { head: true, count: "exact" })
    .eq("ip", ip)
    .eq("acao", "admin_login")
    .gte("criado_em", quinzeMin);

  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde 15 minutos." },
      { status: 429 }
    );
  }

  if (!senhaCorreta(parsed.data.senha)) {
    await supabase.from("rate_limit_ip").insert({ ip, acao: "admin_login" });
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  // 2FA — código TOTP obrigatório se ADMIN_TOTP_SECRET configurado
  if (isTotpEnabled()) {
    if (!parsed.data.codigo || !verifyTotpCode(parsed.data.codigo)) {
      await supabase.from("rate_limit_ip").insert({ ip, acao: "admin_login" });
      return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 401 });
    }
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
