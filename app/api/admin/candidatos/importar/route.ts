import { NextResponse } from "next/server";
import { isAdmin, getAdminTenantOuNull } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { normalizarNome } from "@/lib/utils";

type Linha = { categoria: string; subcategoria: string; nome: string; descricao?: string; foto_url?: string };

function parseCSV(text: string): Linha[] {
  const linhas = text.split(/\r?\n/).filter((l) => l.trim());
  if (linhas.length === 0) return [];
  const head = linhas[0]!.split(",").map((s) => s.trim().toLowerCase());
  const idx = {
    categoria: head.indexOf("categoria"),
    subcategoria: head.indexOf("subcategoria"),
    nome: head.indexOf("nome"),
    descricao: head.indexOf("descricao"),
    foto_url: head.indexOf("foto_url"),
  };
  if (idx.categoria < 0 || idx.subcategoria < 0 || idx.nome < 0) return [];

  const result: Linha[] = [];
  for (let i = 1; i < linhas.length; i++) {
    const cols = parseLine(linhas[i]!);
    const cat = cols[idx.categoria]?.trim();
    const sub = cols[idx.subcategoria]?.trim();
    const nome = cols[idx.nome]?.trim();
    if (!cat || !sub || !nome) continue;
    result.push({
      categoria: cat,
      subcategoria: sub,
      nome,
      descricao: idx.descricao >= 0 ? cols[idx.descricao]?.trim() : undefined,
      foto_url: idx.foto_url >= 0 ? cols[idx.foto_url]?.trim() : undefined,
    });
  }
  return result;
}

function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }

  const text = await file.text();
  const linhas = parseCSV(text);
  if (linhas.length === 0) {
    return NextResponse.json({ error: "CSV vazio ou colunas faltando" }, { status: 400 });
  }

  const tenant = await getAdminTenantOuNull();
  if (!tenant) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  const supabase = createSupabaseAdminClient();

  const { data: edicao } = await supabase
    .from("edicao")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("ativa", true)
    .order("ano", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!edicao) return NextResponse.json({ error: "Edição ativa não encontrada" }, { status: 400 });

  // Pré-busca subcategorias por nome (categoria + sub)
  const { data: catsData } = await supabase
    .from("categorias")
    .select("id, nome, subcategorias(id, nome)")
    .eq("edicao_id", edicao.id);

  const lookup = new Map<string, string>();
  for (const cat of catsData ?? []) {
    for (const sub of (cat as { subcategorias: { id: string; nome: string }[] }).subcategorias ?? []) {
      const k = `${normalizarNome(cat.nome)}|${normalizarNome(sub.nome)}`;
      lookup.set(k, sub.id);
    }
  }

  const inserir: Array<{
    subcategoria_id: string;
    edicao_id: string;
    nome: string;
    nome_normalizado: string;
    descricao: string | null;
    foto_url: string | null;
    origem: "oficial";
    status: "aprovado";
  }> = [];
  const erros: string[] = [];
  let ignorados = 0;

  for (const l of linhas) {
    const k = `${normalizarNome(l.categoria)}|${normalizarNome(l.subcategoria)}`;
    const subId = lookup.get(k);
    if (!subId) {
      erros.push(`Subcategoria não encontrada: ${l.categoria} → ${l.subcategoria}`);
      ignorados++;
      continue;
    }
    inserir.push({
      subcategoria_id: subId,
      edicao_id: edicao.id,
      nome: l.nome,
      nome_normalizado: normalizarNome(l.nome),
      descricao: l.descricao || null,
      foto_url: l.foto_url || null,
      origem: "oficial",
      status: "aprovado",
    });
  }

  let inseridos = 0;
  if (inserir.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < inserir.length; i += chunkSize) {
      const chunk = inserir.slice(i, i + chunkSize);
      const { error, count } = await supabase
        .from("candidatos")
        .insert(chunk, { count: "exact" });
      if (error) {
        erros.push(`Erro no lote ${i / chunkSize + 1}: ${error.message}`);
      } else {
        inseridos += count ?? chunk.length;
      }
    }
  }

  return NextResponse.json({ inseridos, ignorados, erros });
}
