import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Atualiza marca do tenant: logo_url + cores. O upload de arquivo
// vai por outra rota (/upload), aqui so' grava o que ja' foi enviado.
const Body = z.object({
  logo_url: z.string().url().nullable(),
  cor_primaria: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida (use formato #rrggbb)"),
  cor_secundaria: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida (use formato #rrggbb)"),
  assinatura_nome: z.string().trim().max(80).nullable().optional(),
  assinatura_cargo: z.string().trim().max(80).nullable().optional(),
});

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const tenant = await getCurrentTenant();
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("tenants")
    .update({
      logo_url: parsed.data.logo_url,
      cor_primaria: parsed.data.cor_primaria,
      cor_secundaria: parsed.data.cor_secundaria,
      assinatura_nome: parsed.data.assinatura_nome ?? null,
      assinatura_cargo: parsed.data.assinatura_cargo ?? null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", tenant.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
