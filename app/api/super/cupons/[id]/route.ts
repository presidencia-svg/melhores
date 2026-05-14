import { NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin } from "@/lib/super-admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const PatchBody = z.object({
  ativo: z.boolean(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const json = await req.json().catch(() => ({}));
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("cupons")
    .update({ ativo: parsed.data.ativo })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;

  const supabase = createSupabaseAdminClient();

  // Bloqueia delete se ja tem usos — preserva historico/auditoria
  const { count } = await supabase
    .from("cupons_usos")
    .select("*", { head: true, count: "exact" })
    .eq("cupom_id", id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          "Cupom já foi resgatado por algum tenant — pra preservar histórico, só dá pra desativar (não deletar).",
      },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("cupons").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
