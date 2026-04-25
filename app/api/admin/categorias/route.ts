import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({
  edicaoId: z.string().uuid(),
  nome: z.string().min(2).max(80),
  slug: z.string().min(2).max(80),
  descricao: z.string().optional(),
});

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { count } = await supabase
    .from("categorias")
    .select("*", { head: true, count: "exact" })
    .eq("edicao_id", parsed.data.edicaoId);

  const { error } = await supabase.from("categorias").insert({
    edicao_id: parsed.data.edicaoId,
    nome: parsed.data.nome,
    slug: parsed.data.slug,
    descricao: parsed.data.descricao,
    ordem: count ?? 0,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
