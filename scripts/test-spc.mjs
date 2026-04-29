// Teste direto do SPC sem cache nem banco. Roda a chamada e imprime
// a resposta crua pra debug.
//
// Uso:
//   node scripts/test-spc.mjs <cpf> [codigoProduto]
//
// Le SPC_USER, SPC_PASSWORD, SPC_AMBIENTE e (se nao passar) SPC_CODIGO_PRODUTO
// do .env.local. Forca producao se SPC_AMBIENTE=producao.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    console.error("Não achei .env.local em", path);
    process.exit(1);
  }
  const env = {};
  for (const linha of raw.split("\n")) {
    const t = linha.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const env = loadEnv();
const cpf = (process.argv[2] ?? "").replace(/\D/g, "");
const produto = process.argv[3] ?? env.SPC_CODIGO_PRODUTO ?? "325";

if (cpf.length !== 11) {
  console.error("Uso: node scripts/test-spc.mjs <cpf> [codigoProduto]");
  console.error('Exemplo: node scripts/test-spc.mjs "029.417.205-02" 11');
  process.exit(1);
}

const user = env.SPC_USER;
const password = env.SPC_PASSWORD;
if (!user || !password) {
  console.error("SPC_USER/SPC_PASSWORD nao encontrados no .env.local");
  process.exit(1);
}

const ambiente = env.SPC_AMBIENTE ?? "homologacao";
const url =
  ambiente === "producao"
    ? env.SPC_API_URL ?? "https://api.spcbrasil.com.br/spcconsulta/recurso/consulta/padrao"
    : env.SPC_API_URL_HOMOLOG ?? "https://treinamento.spcbrasil.com.br/spcconsulta/recurso/consulta/padrao";

const auth = Buffer.from(`${user}:${password}`).toString("base64");

console.log("─────────────────────────────────────────");
console.log("Ambiente :", ambiente);
console.log("URL      :", url);
console.log("Produto  :", produto);
console.log("CPF      :", cpf);
console.log("─────────────────────────────────────────\n");

const inicio = Date.now();
let res;
try {
  res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      codigoProduto: produto,
      tipoConsumidor: "F",
      documentoConsumidor: cpf,
      codigoInsumoOpcional: [],
    }),
  });
} catch (err) {
  console.error("Falha de rede:", err.message);
  if (err.cause) {
    console.error("Causa     :", err.cause.code ?? err.cause.message ?? err.cause);
    if (err.cause.errors) {
      console.error("Erros     :", err.cause.errors);
    }
  }
  console.error("\nDicas:");
  console.error(" - SPC pode exigir IP whitelist; teste de outro IP com IP fixo (ex.: server VPS) se for o caso.");
  console.error(" - Confira SPC_USER/SPC_PASSWORD no .env.local.");
  console.error(" - Tente rodar com NODE_TLS_REJECT_UNAUTHORIZED=0 prefixado se for erro de cert.");
  process.exit(1);
}

const dur = Date.now() - inicio;
console.log(`HTTP ${res.status} em ${dur}ms\n`);

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  console.log("Resposta nao-JSON:");
  console.log(text);
  process.exit(0);
}

console.log("Resposta crua:");
console.log(JSON.stringify(json, null, 2));

console.log("\n─────────────────────────────────────────");
console.log("Tentativas de extracao de nome:");
const candidatos = [
  ["consumidorPessoaFisica.nome", json?.result?.return_object?.resultado?.consumidor?.consumidorPessoaFisica?.nome],
  ["consumidor.nome", json?.result?.return_object?.resultado?.consumidor?.nome],
  ["resultado.nome", json?.result?.return_object?.resultado?.nome],
  ["return_object.nome", json?.result?.return_object?.nome],
  ["result.nome", json?.result?.nome],
  ["nome (top-level)", json?.nome],
];
for (const [path, val] of candidatos) {
  console.log(` ${val ? "✓" : "✗"} ${path}: ${val ?? "(vazio)"}`);
}
