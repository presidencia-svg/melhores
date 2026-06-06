import { NextResponse } from "next/server";
import { getAdminTenantOuNull } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const tenant = await getAdminTenantOuNull();
  if (!tenant) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = createSupabaseAdminClient();

  // Cross-tenant guard: SEM o join edicao!inner(tenant_id), o endpoint
  // exportava TODOS os whatsapps de TODOS os tenants em CSV — violacao
  // LGPD direta (admin de A baixava contatos de B). Filtra pela edicao
  // do tenant logado.
  const { data } = await supabase
    .from("votantes")
    .select("nome, whatsapp, criado_em, edicao!inner(tenant_id)")
    .eq("edicao.tenant_id", tenant.id)
    .eq("whatsapp_validado", true)
    .order("criado_em", { ascending: false });

  const linhas = ["nome,whatsapp,data"];
  for (const v of data ?? []) {
    const nome = (v.nome ?? "").replace(/"/g, '""');
    linhas.push(`"${nome}","${v.whatsapp ?? ""}","${v.criado_em}"`);
  }

  return new NextResponse(linhas.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="whatsapps-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
