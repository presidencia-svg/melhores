import { NextResponse } from "next/server";
import { z } from "zod";
import {
  isAdmin,
  getAdminTenantOuNull,
  senhaCorretaParaTenant,
} from "@/lib/admin/auth";
import { hashSenha } from "@/lib/admin/password";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({
  atual: z.string().min(1),
  nova: z.string().min(8).max(128),
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
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Senha nova precisa de 8+ caracteres" },
      { status: 400 }
    );
  }

  const senhaAtualOk = await senhaCorretaParaTenant(parsed.data.atual, tenant);
  if (!senhaAtualOk) {
    return NextResponse.json({ error: "Senha atual incorreta" }, { status: 401 });
  }

  const hash = await hashSenha(parsed.data.nova);

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("tenants")
    .update({ admin_password_hash: hash })
    .eq("id", tenant.id);

  if (error) {
    return NextResponse.json(
      { error: `Falha: ${error.message}` },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
