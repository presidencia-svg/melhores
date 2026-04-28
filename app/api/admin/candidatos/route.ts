import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { normalizarNome } from "@/lib/utils";

const Body = z.object({
  subcategoria_id: z.string().uuid(),
  nome: z.string().trim().min(2).max(120),
  descricao: z.string().trim().max(280).optional().nullable(),
  foto_url: z.string().url().optional().nullable(),
});

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", detalhe: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("candidatos")
    .insert({
      subcategoria_id: parsed.data.subcategoria_id,
      nome: parsed.data.nome,
      nome_normalizado: normalizarNome(parsed.data.nome),
      descricao: parsed.data.descricao || null,
      foto_url: parsed.data.foto_url || null,
      origem: "oficial",
      status: "aprovado",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
