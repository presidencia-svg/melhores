import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { isAdmin } from "@/lib/admin/auth";
import { getCurrentTenant } from "@/lib/tenant/resolver";
import { getEdicaoStatus } from "@/lib/edicao-status";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Mapa empresa→{categoria, subcategoria} dos top1 do podio.
// Usado pra auto-preencher slides na importacao.
async function carregarMapaPodio(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  edicaoId: string | null
): Promise<Map<string, { categoria: string; subcategoria: string }>> {
  if (!edicaoId) return new Map();
  const [{ data: podiums }, { data: subcatMap }] = await Promise.all([
    supabase
      .from("v_podium")
      .select(
        "subcategoria_id, subcategoria_nome, top1_nome, top1_votos, top2_id, top2_nome, top2_votos"
      )
      .eq("edicao_id", edicaoId)
      .gt("top1_votos", 0),
    supabase
      .from("subcategorias")
      .select("id, categoria:categorias(nome)")
      .eq("edicao_id", edicaoId),
  ]);

  type SubRow = {
    id: string;
    categoria: { nome: string } | { nome: string }[] | null;
  };
  const catBySub = new Map<string, string>();
  for (const r of (subcatMap ?? []) as SubRow[]) {
    const cat = Array.isArray(r.categoria) ? r.categoria[0] : r.categoria;
    if (cat?.nome) catBySub.set(r.id, cat.nome);
  }

  const m = new Map<string, { categoria: string; subcategoria: string }>();
  for (const p of (podiums ?? []) as Array<{
    subcategoria_id: string;
    subcategoria_nome: string;
    top1_nome: string;
    top1_votos: number;
    top2_id: string | null;
    top2_nome: string | null;
    top2_votos: number;
  }>) {
    const categoria = catBySub.get(p.subcategoria_id) ?? "—";
    m.set(normalize(p.top1_nome), {
      categoria,
      subcategoria: p.subcategoria_nome,
    });
    // Empatado em 1o lugar tambem entra
    if (p.top2_nome && p.top2_votos === p.top1_votos) {
      m.set(normalize(p.top2_nome), {
        categoria,
        subcategoria: p.subcategoria_nome,
      });
    }
  }
  return m;
}

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

  // Carrega mapa do podio pra auto-match de categoria/subcategoria
  const mapaPodio = await carregarMapaPodio(supabase, edicaoId);

  const insertRows: Array<{
    tenant_id: string;
    edicao_id: string | null;
    ordem: number;
    empresa: string;
    recebe: string | null;
    instagram: string | null;
    categoria: string | null;
    subcategoria: string | null;
  }> = [];

  let ordem = 0;
  let matchados = 0;
  for (const row of rows) {
    const empresa = String(row[colMap.empresa] ?? "").trim();
    if (!empresa) continue;
    const recebe = colMap.recebe
      ? String(row[colMap.recebe] ?? "").trim() || null
      : null;
    const instagram = colMap.instagram
      ? String(row[colMap.instagram] ?? "").trim() || null
      : null;
    const match = mapaPodio.get(normalize(empresa));
    if (match) matchados++;
    insertRows.push({
      tenant_id: tenant.id,
      edicao_id: edicaoId,
      ordem: ordem++,
      empresa,
      recebe,
      instagram,
      categoria: match?.categoria ?? null,
      subcategoria: match?.subcategoria ?? null,
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

  return NextResponse.json({
    ok: true,
    inseridos: insertRows.length,
    matchados,
  });
}
