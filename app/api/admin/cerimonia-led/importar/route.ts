import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { isAdmin } from "@/lib/admin/auth";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Importa planilha xlsx pra cerimonia_slides. Espera colunas:
//   EMPRESA / QUEM VAI RECEBER O PREMIO / @ DO INSTAGRAM
// (variacoes case-insensitive). Cria 1 slide por linha. Sobrescreve
// tudo do tenant atual + edicao ativa.

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }
  const file = formData.get("planilha");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Planilha não enviada" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: "buffer" });
  } catch (e) {
    return NextResponse.json(
      { error: `Falha ao ler xlsx: ${e instanceof Error ? e.message : "?"}` },
      { status: 400 }
    );
  }

  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return NextResponse.json({ error: "Planilha vazia" }, { status: 400 });
  }
  const sheet = wb.Sheets[sheetName]!;
  type Row = Record<string, string | number | undefined>;
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });

  if (rows.length === 0) {
    return NextResponse.json({ error: "Planilha sem linhas" }, { status: 400 });
  }

  // Mapeia colunas case-insensitive sem acento
  const firstRow = rows[0]!;
  const colMap: { empresa?: string; recebe?: string; instagram?: string } = {};
  for (const key of Object.keys(firstRow)) {
    const n = normalize(key);
    if (n.includes("empresa") || n.includes("emresa")) colMap.empresa = key;
    else if (n.includes("recebe") || n.includes("premio")) colMap.recebe = key;
    else if (n.includes("instagram") || n.startsWith("@")) colMap.instagram = key;
  }

  if (!colMap.empresa) {
    return NextResponse.json(
      {
        error:
          "Não encontrei coluna 'EMPRESA' na planilha. Renomeie no Excel e tente de novo.",
      },
      { status: 400 }
    );
  }

  const tenant = await getCurrentTenant();
  const edicaoStatus = await getEdicaoStatus(tenant.id);
  const edicaoId =
    edicaoStatus.status !== "sem_edicao" ? edicaoStatus.edicao.id : null;

  const supabase = createSupabaseAdminClient();

  // Apaga slides anteriores desse tenant pra evitar duplicacao
  await supabase
    .from("cerimonia_slides")
    .delete()
    .eq("tenant_id", tenant.id);

  const insertRows: Array<{
    tenant_id: string;
    edicao_id: string | null;
    ordem: number;
    empresa: string;
    recebe: string | null;
    instagram: string | null;
  }> = [];

  let ordem = 0;
  for (const row of rows) {
    const empresa = String(row[colMap.empresa] ?? "").trim();
    if (!empresa) continue;
    const recebe = colMap.recebe
      ? String(row[colMap.recebe] ?? "").trim() || null
      : null;
    const instagram = colMap.instagram
      ? String(row[colMap.instagram] ?? "").trim() || null
      : null;
    insertRows.push({
      tenant_id: tenant.id,
      edicao_id: edicaoId,
      ordem: ordem++,
      empresa,
      recebe,
      instagram,
    });
  }

  if (insertRows.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma linha válida encontrada na planilha" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("cerimonia_slides").insert(insertRows);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inseridos: insertRows.length });
}
