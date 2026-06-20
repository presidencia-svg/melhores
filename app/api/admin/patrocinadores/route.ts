import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminTenantOuNull } from "@/lib/admin/auth";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({
  nome: z.string().trim().min(2).max(120),
  logo_url: z.string().url(),
  link: z.string().url().nullable().optional(),
  nivel: z.enum(["master", "ouro", "prata", "bronze", "apoio"]).default("apoio"),
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
