import { NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin } from "@/lib/super-admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({
  codigo: z.string().trim().min(3).max(40).regex(
    /^[A-Za-z0-9_-]+$/,
    "Código só pode ter letras, números, hífen e underscore"
  ),
  valor_centavos: z.number().int().positive(),
  tipo: z.enum([
    "multi_tenant_1x_cada",
    "uso_unico_global",
    "multi_uso_livre",
  ]),
  expira_em: z.string().datetime().nullable().optional(),
  max_usos: z.number().int().positive().nullable().optional(),
  descricao: z.string().trim().max(200).nullable().optional(),
});

export async function POST(req: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const codigo = parsed.data.codigo.trim().toUpperCase();

  const { data, error } = await supabase
    .from("cupons")
    .insert({
      codigo,
      valor_centavos: parsed.data.valor_centavos,
      tipo: parsed.data.tipo,
      expira_em: parsed.data.expira_em ?? null,
      max_usos: parsed.data.max_usos ?? null,
      descricao: parsed.data.descricao ?? null,
      ativo: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: `Já existe cupom com o código "${codigo}"` },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: `Falha: ${error?.message ?? "?"}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: data.id, codigo });
}
