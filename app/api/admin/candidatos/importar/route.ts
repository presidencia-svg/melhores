import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getAdminTenantOuNull } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { normalizarNome } from "@/lib/utils";

// Aceita CSV e XLSX. Auto-cria categorias e subcategorias que ainda
// nao existem na edicao ativa, reusa as que ja existem (case + acento
// insensitive via normalizarNome). Anti-dup de candidato dentro da
// mesma subcategoria.

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_LINHAS = 5000;

type Linha = {
  categoria: string;
  subcategoria: string;
  nome: string;
  descricao?: string;
  foto_url?: string;
};

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

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

async function parseXLSX(buffer: ArrayBuffer): Promise<Linha[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  // Tenta a aba "Candidatos" — se nao tiver, usa a primeira
  const ws = wb.getWorksheet("Candidatos") ?? wb.worksheets[0];
  if (!ws) return [];

  // Le cabecalho (linha 1)
  const headerRow = ws.getRow(1);
  const headers: Record<string, number> = {};
  headerRow.eachCell((cell, colNumber) => {
    const v = String(cell.value ?? "").trim().toLowerCase();
    if (v) headers[v] = colNumber;
  });

  const idxCat = headers["categoria"];
  const idxSub = headers["subcategoria"];
  const idxNome = headers["nome"];
  if (!idxCat || !idxSub || !idxNome) return [];

  const result: Linha[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const get = (col: number | undefined): string => {
      if (!col) return "";
      const v = row.getCell(col).value;
      if (v == null) return "";
      if (typeof v === "string") return v.trim();
      if (typeof v === "number" || typeof v === "boolean") return String(v);
      if (typeof v === "object" && "text" in v) return String((v as { text: string }).text).trim();
      return String(v).trim();
    };
    const cat = get(idxCat);
    const sub = get(idxSub);
    const nome = get(idxNome);
    if (!cat || !sub || !nome) return;
    result.push({
      categoria: cat,
      subcategoria: sub,
      nome,
      descricao: get(headers["descricao"]) || undefined,
      foto_url: get(headers["foto_url"]) || undefined,
    });
  });
  return result;
}

export async function POST(req: Request) {
  const tenant = await getAdminTenantOuNull();
  if (!tenant) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Arquivo maior que ${MAX_BYTES / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  const isXlsx =
    file.name.toLowerCase().endsWith(".xlsx") ||
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const isCsv =
    file.name.toLowerCase().endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/csv" ||
    file.type === "application/vnd.ms-excel";

  if (!isXlsx && !isCsv) {
    return NextResponse.json(
      {
        error: `Formato não suportado (${file.type || file.name}). Use .xlsx ou .csv`,
      },
      { status: 400 }
    );
  }

  let linhas: Linha[];
  try {
    if (isXlsx) {
      linhas = await parseXLSX(await file.arrayBuffer());
    } else {
      linhas = parseCSV(await file.text());
    }
  } catch (e) {
    return NextResponse.json(
      {
        error: `Falha ao ler arquivo: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 400 }
    );
  }

  if (linhas.length === 0) {
    return NextResponse.json(
      {
        error: "Arquivo vazio ou colunas faltando. Esperado: categoria, subcategoria, nome (+ opcionais descricao, foto_url).",
      },
      { status: 400 }
    );
  }
  if (linhas.length > MAX_LINHAS) {
    return NextResponse.json(
      { error: `Máximo de ${MAX_LINHAS} linhas por importação. Divida em arquivos menores.` },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: edicao } = await supabase
    .from("edicao")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("ativa", true)
    .order("ano", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!edicao) {
    return NextResponse.json({ error: "Edição ativa não encontrada" }, { status: 400 });
  }

  // 1) Categorias existentes
  const { data: catsData } = await supabase
    .from("categorias")
    .select("id, nome, slug, ordem, subcategorias(id, nome, slug, ordem)")
    .eq("edicao_id", edicao.id);

  type CatRow = {
    id: string;
    nome: string;
    slug: string;
    ordem: number;
    subcategorias: { id: string; nome: string; slug: string; ordem: number }[];
  };

  const catPorNorm = new Map<string, CatRow>();
  for (const c of (catsData ?? []) as CatRow[]) {
    catPorNorm.set(normalizarNome(c.nome), c);
  }

  // 2) Determina quais categorias precisam ser criadas
  const novasCategorias = new Map<string, string>(); // norm → nome original
  const novasSubs = new Map<
    string,
    { categoriaNorm: string; subNome: string; subNorm: string }
  >(); // "catNorm|subNorm" → dados

  for (const l of linhas) {
    const catNorm = normalizarNome(l.categoria);
    const subNorm = normalizarNome(l.subcategoria);
    const k = `${catNorm}|${subNorm}`;
    const catExistente = catPorNorm.get(catNorm);
    if (!catExistente) {
      novasCategorias.set(catNorm, l.categoria);
    }
    // Se categoria existe mas sub nao, marca pra criar
    const subExistente = catExistente?.subcategorias.find(
      (s) => normalizarNome(s.nome) === subNorm
    );
    if (!subExistente && !novasSubs.has(k)) {
      novasSubs.set(k, {
        categoriaNorm: catNorm,
        subNome: l.subcategoria,
        subNorm,
      });
    }
  }

  // 3) Cria categorias novas (ordem = max + 1, slug = slugify do nome)
  let categoriasCriadas = 0;
  if (novasCategorias.size > 0) {
    const maxOrdem = (catsData ?? []).reduce(
      (mx, c) => Math.max(mx, (c as CatRow).ordem ?? 0),
      0
    );
    const inserir = Array.from(novasCategorias.entries()).map(
      ([, nome], i) => ({
        edicao_id: edicao.id,
        nome,
        slug: slugify(nome) || `cat-${Date.now()}-${i}`,
        ordem: maxOrdem + 1 + i,
      })
    );
    const { data: criadas, error } = await supabase
      .from("categorias")
      .insert(inserir)
      .select("id, nome, slug, ordem");
    if (error) {
      return NextResponse.json(
        { error: `Falha ao criar categorias: ${error.message}` },
        { status: 500 }
      );
    }
    for (const c of criadas ?? []) {
      const row: CatRow = {
        id: c.id,
        nome: c.nome,
        slug: c.slug,
        ordem: c.ordem,
        subcategorias: [],
      };
      catPorNorm.set(normalizarNome(c.nome), row);
      categoriasCriadas++;
    }
  }

  // 4) Cria subcategorias novas
  let subcategoriasCriadas = 0;
  if (novasSubs.size > 0) {
    const inserir: Array<{
      categoria_id: string;
      edicao_id: string;
      nome: string;
      slug: string;
      ordem: number;
    }> = [];
    let i = 0;
    for (const { categoriaNorm, subNome } of novasSubs.values()) {
      const cat = catPorNorm.get(categoriaNorm);
      if (!cat) continue;
      const maxOrdem = cat.subcategorias.reduce(
        (mx, s) => Math.max(mx, s.ordem ?? 0),
        0
      );
      inserir.push({
        categoria_id: cat.id,
        edicao_id: edicao.id,
        nome: subNome,
        slug: slugify(subNome) || `sub-${Date.now()}-${i}`,
        ordem: maxOrdem + 1,
      });
      i++;
    }
    if (inserir.length > 0) {
      const { data: criadas, error } = await supabase
        .from("subcategorias")
        .insert(inserir)
        .select("id, nome, slug, ordem, categoria_id");
      if (error) {
        return NextResponse.json(
          { error: `Falha ao criar subcategorias: ${error.message}` },
          { status: 500 }
        );
      }
      for (const s of criadas ?? []) {
        const cat = Array.from(catPorNorm.values()).find(
          (c) => c.id === s.categoria_id
        );
        if (cat) {
          cat.subcategorias.push({
            id: s.id,
            nome: s.nome,
            slug: s.slug,
            ordem: s.ordem,
          });
        }
        subcategoriasCriadas++;
      }
    }
  }

  // 5) Lookup atualizado pra inserir candidatos
  const lookupSub = new Map<string, string>();
  for (const cat of catPorNorm.values()) {
    for (const sub of cat.subcategorias) {
      const k = `${normalizarNome(cat.nome)}|${normalizarNome(sub.nome)}`;
      lookupSub.set(k, sub.id);
    }
  }

  // 6) Pre-carrega candidatos existentes pra evitar duplicacao
  const { data: candidatosExistentes } = await supabase
    .from("candidatos")
    .select("subcategoria_id, nome_normalizado")
    .eq("edicao_id", edicao.id);
  const existentes = new Set(
    (candidatosExistentes ?? []).map(
      (c) => `${c.subcategoria_id}|${c.nome_normalizado}`
    )
  );

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
  const yaInserir = new Set<string>();

  for (const l of linhas) {
    const k = `${normalizarNome(l.categoria)}|${normalizarNome(l.subcategoria)}`;
    const subId = lookupSub.get(k);
    if (!subId) {
      erros.push(`Subcategoria não criada/encontrada: ${l.categoria} → ${l.subcategoria}`);
      ignorados++;
      continue;
    }
    const nomeNorm = normalizarNome(l.nome);
    const dupKey = `${subId}|${nomeNorm}`;
    if (existentes.has(dupKey) || yaInserir.has(dupKey)) {
      ignorados++;
      continue;
    }
    yaInserir.add(dupKey);
    inserir.push({
      subcategoria_id: subId,
      edicao_id: edicao.id,
      nome: l.nome,
      nome_normalizado: nomeNorm,
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

  return NextResponse.json({
    inseridos,
    ignorados,
    categoriasCriadas,
    subcategoriasCriadas,
    erros,
  });
}
