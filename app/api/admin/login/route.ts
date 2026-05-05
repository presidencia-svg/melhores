import { NextResponse } from "next/server";
import { z } from "zod";
import {
  senhaCorretaParaTenant,
  setAdminSession,
} from "@/lib/admin/auth";
import { tenantTemTotp, verifyTotpParaTenant } from "@/lib/admin/totp";
import { getClientIp } from "@/lib/utils";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/resolver";

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
  const tenant = await getCurrentTenant();

  // Rate limit: 5 tentativas por IP em 15min (cap global, nao por tenant —
  // protege o IP atacante independente de qual host tentou).
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

  const senhaOk = await senhaCorretaParaTenant(parsed.data.senha, tenant);
  if (!senhaOk) {
    await supabase.from("rate_limit_ip").insert({ ip, acao: "admin_login" });
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  // 2FA — codigo TOTP obrigatorio se o tenant tem secret configurado.
  if (tenantTemTotp(tenant)) {
    if (
      !parsed.data.codigo ||
      !verifyTotpParaTenant(parsed.data.codigo, tenant)
    ) {
      await supabase.from("rate_limit_ip").insert({ ip, acao: "admin_login" });
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 401 }
      );
    }
  }

  await setAdminSession(tenant.id);
  return NextResponse.json({ ok: true });
}
