import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const PatchBody = z.object({
  fim_votacao: z.string().datetime().optional(),
  inicio_votacao: z.string().datetime().optional(),
  divulgacao_resultado: z.string().datetime().nullable().optional(),
});

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const supabase = createSupabaseAdminClient();
  const { data: edicao } = await supabase
    .from("edicao")
    .select(
      "id, ano, nome, inicio_votacao, fim_votacao, divulgacao_resultado, ativa"
    )
    .eq("ativa", true)
    .order("ano", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!edicao) {
    return NextResponse.json({ error: "Sem edição ativa" }, { status: 404 });
  }
  return NextResponse.json({ edicao });
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Datas inválidas. Use ISO 8601 com timezone (ex.: 2026-05-15T20:00:00-03:00).",
      },
      { status: 400 }
    );
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Nada pra atualizar" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: edicao } = await supabase
    .from("edicao")
    .select("id")
    .eq("ativa", true)
    .order("ano", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!edicao) {
    return NextResponse.json({ error: "Sem edição ativa" }, { status: 404 });
  }

  const { error } = await supabase
    .from("edicao")
    .update(parsed.data)
    .eq("id", edicao.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
