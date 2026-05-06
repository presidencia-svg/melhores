import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { normalizarNome, nomeCandidatoValido, tituloPT } from "@/lib/utils";

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

  const validacao = nomeCandidatoValido(parsed.data.nome);
  if (!validacao.ok) {
    return NextResponse.json({ error: validacao.motivo }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const nomeFormatado = tituloPT(parsed.data.nome);
  const nomeNorm = normalizarNome(nomeFormatado);

  // edicao_id herda da subcategoria pai (denorm — schema 035).
  const { data: subcat } = await supabase
    .from("subcategorias")
    .select("edicao_id")
    .eq("id", parsed.data.subcategoria_id)
    .maybeSingle();
  if (!subcat) {
    return NextResponse.json({ error: "Subcategoria não encontrada" }, { status: 404 });
  }

  // Bloqueia nome duplicado na mesma subcategoria (entre aprovados)
  const { data: existente } = await supabase
    .from("candidatos")
    .select("id, nome")
    .eq("subcategoria_id", parsed.data.subcategoria_id)
    .eq("nome_normalizado", nomeNorm)
    .eq("status", "aprovado")
    .maybeSingle();
  if (existente) {
    return NextResponse.json(
      { error: `Já existe candidato "${existente.nome}" nessa subcategoria` },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("candidatos")
    .insert({
      subcategoria_id: parsed.data.subcategoria_id,
      edicao_id: subcat.edicao_id,
      nome: nomeFormatado,
      nome_normalizado: nomeNorm,
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
