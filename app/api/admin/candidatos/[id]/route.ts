import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { normalizarNome } from "@/lib/utils";

const PatchBody = z.object({
  nome: z.string().min(2).max(120).optional(),
  descricao: z.string().max(280).nullable().optional(),
  foto_url: z.string().url().nullable().optional(),
  status: z.enum(["aprovado", "rejeitado", "pendente", "duplicado"]).optional(),
  subcategoria_id: z.string().uuid().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const json = await req.json().catch(() => ({}));
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.nome) {
    update.nome_normalizado = normalizarNome(parsed.data.nome);
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("candidatos").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("candidatos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
