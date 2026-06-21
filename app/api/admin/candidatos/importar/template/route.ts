import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getAdminTenantOuNull } from "@/lib/admin/auth";

// Gera o template XLSX que o admin baixa pra preencher e reimportar.
// Inclui cabecalho + algumas linhas de exemplo + uma aba de instrucoes.
export async function GET() {
  const tenant = await getAdminTenantOuNull();
  if (!tenant) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "Melhores do Ano";
  wb.created = new Date();

  // === Aba 1: Candidatos ===
  const ws = wb.addWorksheet("Candidatos");
  ws.columns = [
    { header: "categoria", key: "categoria", width: 28 },
    { header: "subcategoria", key: "subcategoria", width: 32 },
    { header: "nome", key: "nome", width: 40 },
    { header: "descricao", key: "descricao", width: 50 },
    { header: "foto_url", key: "foto_url", width: 50 },
  ];

  // Estilo do cabecalho
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0A2A5E" },
  };
  head.alignment = { vertical: "middle", horizontal: "left" };
  head.height = 22;

  // Linhas de exemplo
  ws.addRow({
    categoria: "Gastronomia",
    subcategoria: "Pizzaria",
    nome: "Santa Pizza",
    descricao: "Tradição em Aracaju desde 1985",
    foto_url: "https://exemplo.com/santa-pizza.png",
  });
  ws.addRow({
    categoria: "Gastronomia",
    subcategoria: "Pizzaria",
    nome: "Villa Veron",
    descricao: "",
    foto_url: "",
  });
  ws.addRow({
    categoria: "Gastronomia",
    subcategoria: "Hamburgueria",
    nome: "Empório do Burger",
    descricao: "Burger artesanal",
    foto_url: "",
  });
  ws.addRow({
    categoria: "Comércio",
    subcategoria: "Supermercado",
    nome: "Atakarejo",
    descricao: "",
    foto_url: "",
  });

  // === Aba 2: Instruções ===
  const wsHelp = wb.addWorksheet("Instruções");
  wsHelp.columns = [{ width: 100 }];
  const linhas = [
    ["COMO USAR ESTE TEMPLATE"],
    [""],
    ["1. Preencha a aba 'Candidatos' com uma linha por candidato."],
    ["2. As colunas 'categoria' e 'subcategoria' criam o grupo/subgrupo automaticamente"],
    ["   se ainda não existirem na edição ativa. Se já existirem, são reutilizadas."],
    ["3. 'nome' é o nome do candidato (obrigatório)."],
    ["4. 'descricao' e 'foto_url' são opcionais — podem ficar em branco."],
    [""],
    ["EXEMPLO PRÁTICO:"],
    [""],
    ["Se você quer cadastrar 3 pizzarias na categoria 'Gastronomia' →"],
    ["subcategoria 'Pizzaria', basta criar 3 linhas com mesma categoria"],
    ["e subcategoria, mudando só o nome do candidato."],
    [""],
    ["FORMATOS ACEITOS:"],
    [""],
    ["• XLSX (este formato) — recomendado"],
    ["• CSV separado por vírgula com mesmas colunas"],
    [""],
    ["LIMITES:"],
    [""],
    ["• Arquivo máximo 10MB"],
    ["• Até 15.000 linhas por importação"],
    ["• Nome do candidato: 2 a 120 caracteres"],
    [""],
    ["DUPLICATAS:"],
    [""],
    ["• Candidatos com nome igual na mesma subcategoria são ignorados (anti-dup)"],
    ["• Categorias/subcategorias com nome igual são reutilizadas"],
  ];
  for (const l of linhas) {
    wsHelp.addRow(l);
  }
  wsHelp.getRow(1).font = { bold: true, size: 14, color: { argb: "FF0A2A5E" } };
  for (const titulo of [9, 15, 20, 26]) {
    wsHelp.getRow(titulo).font = { bold: true, color: { argb: "FFD4A537" } };
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="template-candidatos-melhores-do-ano.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
