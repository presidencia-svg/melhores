import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getAdminTenantOuNull } from "@/lib/admin/auth";
import { verifyTotpParaTenant } from "@/lib/admin/totp";
import { verifySync } from "otplib";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// POST: ativa 2FA com `secret` novo + `codigo` que o usuario gerou no app.
// Validamos o codigo CONTRA o secret novo (nao o do tenant atual) — quem
// chama precisa provar que escaneou o QR antes de gravar.
const PostBody = z.object({
  secret: z.string().min(16),
  codigo: z.string().regex(/^\d{6}$/),
});

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const tenant = await getAdminTenantOuNull();
  if (!tenant) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = PostBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Valida que o codigo bate com o secret novo (prova que escaneou o QR).
  let valido = false;
  try {
    valido =
      verifySync({
        token: parsed.data.codigo,
        secret: parsed.data.secret,
        epochTolerance: 30,
      }).valid === true;
  } catch {
    valido = false;
  }
  if (!valido) {
    return NextResponse.json(
      { error: "Código inválido — confira no app e tente de novo" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("tenants")
    .update({ admin_totp_secret: parsed.data.secret })
    .eq("id", tenant.id);

  if (error) {
    return NextResponse.json(
      { error: `Falha: ${error.message}` },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}

// DELETE: desativa 2FA. Pede `codigo` atual pra evitar clickjack/CSRF.
const DeleteBody = z.object({
  codigo: z.string().regex(/^\d{6}$/),
});

export async function DELETE(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const tenant = await getAdminTenantOuNull();
  if (!tenant) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = DeleteBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  if (!verifyTotpParaTenant(parsed.data.codigo, tenant)) {
    return NextResponse.json(
      { error: "Código inválido" },
      { status: 401 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("tenants")
    .update({ admin_totp_secret: null })
    .eq("id", tenant.id);

  if (error) {
    return NextResponse.json(
      { error: `Falha: ${error.message}` },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
