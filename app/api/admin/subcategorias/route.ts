import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({
  categoriaId: z.string().uuid(),
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

  // edicao_id da subcategoria herda da categoria pai (denorm necessario
  // pelo schema 035 — coluna NOT NULL).
  const { data: categoria } = await supabase
    .from("categorias")
    .select("edicao_id")
    .eq("id", parsed.data.categoriaId)
    .maybeSingle();
  if (!categoria) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  const { count } = await supabase
    .from("subcategorias")
    .select("*", { head: true, count: "exact" })
    .eq("categoria_id", parsed.data.categoriaId);

  const { error } = await supabase.from("subcategorias").insert({
    categoria_id: parsed.data.categoriaId,
    edicao_id: categoria.edicao_id,
    nome: parsed.data.nome,
    slug: parsed.data.slug,
    descricao: parsed.data.descricao,
    ordem: count ?? 0,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
