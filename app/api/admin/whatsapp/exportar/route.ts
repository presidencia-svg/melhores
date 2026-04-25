import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("votantes")
    .select("nome, whatsapp, criado_em")
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
