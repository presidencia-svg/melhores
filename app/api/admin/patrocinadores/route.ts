import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminTenantOuNull } from "@/lib/admin/auth";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { COTAS } from "@/lib/patrocinadores/types";

const Body = z.object({
  nome: z.string().trim().min(2).max(120),
  logo_url: z.string().url(),
  link: z.string().url().nullable().optional(),
  nivel: z.enum(["patrocinio", "apoio"]).default("apoio"),
  ordem: z.number().int().min(0).max(9999).default(0),
});

export async function POST(req: Request) {
  const tenant = await getAdminTenantOuNull();
  if (!tenant) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const status = await getEdicaoStatus(tenant.id);
  if (status.status === "sem_edicao") {
    return NextResponse.json({ error: "Sem edição ativa" }, { status: 400 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Valida cotas antes do INSERT: patrocinio max 1, apoio max 4.
  // O banco ja' garante patrocinio unico via unique partial — esse
  // pre-check serve pra dar mensagem de erro amigavel em vez de
  // unique_violation 23505. Pra apoio, soft limit so' aqui na API.
  const limite = COTAS[parsed.data.nivel];
  const { count } = await supabase
    .from("patrocinadores")
    .select("*", { head: true, count: "exact" })
    .eq("edicao_id", status.edicao.id)
    .eq("nivel", parsed.data.nivel)
    .eq("ativo", true);
  if ((count ?? 0) >= limite) {
    return NextResponse.json(
      {
        error:
          parsed.data.nivel === "patrocinio"
            ? "Já existe um patrocinador principal. Remova o atual antes de cadastrar outro."
            : `Limite de ${limite} apoios atingido. Remova um existente antes de cadastrar outro.`,
      },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("patrocinadores")
    .insert({
      tenant_id: tenant.id,
      edicao_id: status.edicao.id,
      nome: parsed.data.nome,
      logo_url: parsed.data.logo_url,
      link: parsed.data.link ?? null,
      nivel: parsed.data.nivel,
      ordem: parsed.data.ordem,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
