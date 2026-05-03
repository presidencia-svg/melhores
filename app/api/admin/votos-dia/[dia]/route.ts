import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const DIA_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dia: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { dia } = await params;
  if (!DIA_RE.test(dia)) {
    return NextResponse.json({ error: "Dia inválido" }, { status: 400 });
  }
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("votos_por_dia_detalhe", {
    p_dia: dia,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
