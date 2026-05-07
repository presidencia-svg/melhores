// Puxa numeros reais da campanha CDL Aracaju 2026 pra usar na apresentacao
// de vendas. Roda com: npx tsx scripts/numeros-campanha.ts
//
// Saida: JSON formatado com todas as metricas que vao no PDF.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";

// Carrega .env.local manualmente (sem dotenv).
const env = readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  // 1. Tenant + edicao
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, nome")
    .eq("slug", "aracaju")
    .single();
  if (!tenant) throw new Error("tenant aracaju nao achado");

  const { data: edicao } = await supabase
    .from("edicao")
    .select("id, ano, nome, inicio_votacao, fim_votacao")
    .eq("tenant_id", tenant.id)
    .eq("ativa", true)
    .order("ano", { ascending: false })
    .limit(1)
    .single();
  if (!edicao) throw new Error("edicao ativa nao achada");

  console.log("=== Tenant + Edição ===");
  console.log(JSON.stringify({ tenant, edicao }, null, 2));

  // 2. RPC numeros_campanha
  const { data: numeros } = await supabase.rpc("numeros_campanha", {
    p_edicao_id: edicao.id,
  });

  console.log("\n=== Números da campanha (RPC) ===");
  console.log(JSON.stringify(numeros?.[0] ?? numeros, null, 2));

  // 3. Categorias e candidatos
  const [{ count: cats }, { count: cands }] = await Promise.all([
    supabase
      .from("categorias")
      .select("*", { head: true, count: "exact" })
      .eq("edicao_id", edicao.id)
      .eq("ativa", true),
    supabase
      .from("candidatos")
      .select("*", { head: true, count: "exact" })
      .eq("edicao_id", edicao.id)
      .eq("status", "aprovado"),
  ]);

  console.log("\n=== Categorias e Candidatos ===");
  console.log({ categorias_ativas: cats, candidatos_aprovados: cands });

  // 4. Mobile vs desktop
  const [{ count: total_v }, { count: mobile_v }] = await Promise.all([
    supabase
      .from("votantes")
      .select("*", { head: true, count: "exact" })
      .eq("edicao_id", edicao.id),
    supabase
      .from("votantes")
      .select("*", { head: true, count: "exact" })
      .eq("edicao_id", edicao.id)
      .or(
        "user_agent.ilike.%Mobile%,user_agent.ilike.%Android%,user_agent.ilike.%iPhone%,user_agent.ilike.%iPad%"
      ),
  ]);

  console.log("\n=== Dispositivos ===");
  console.log({
    total_votantes: total_v,
    mobile: mobile_v,
    desktop: (total_v ?? 0) - (mobile_v ?? 0),
    pct_mobile: total_v
      ? ((mobile_v ?? 0) / total_v * 100).toFixed(1) + "%"
      : "n/a",
  });

  // 5. Top 5 categorias mais votadas
  const { data: topCats } = await supabase
    .from("v_resultados_por_categoria")
    .select("categoria_nome, total_votos")
    .eq("edicao_id", edicao.id)
    .order("total_votos", { ascending: false })
    .limit(5);

  console.log("\n=== Top 5 categorias mais votadas ===");
  console.log(topCats);

  // 6. Distribuicao OTPs (whatsapp_codigos)
  const { count: total_otps } = await supabase
    .from("whatsapp_codigos")
    .select("*", { head: true, count: "exact" });

  console.log("\n=== OTPs (whatsapp_codigos, lifetime) ===");
  console.log({ total_otps_gerados: total_otps });

  // 7. Total votos + validações anti-fraude (queries diretas)
  const [
    { count: total_votos },
    { count: subs_ativas },
    { count: spc_validados },
    { count: wa_validados },
    { count: com_selfie },
    { data: ipsDist },
    { data: devDist },
  ] = await Promise.all([
    supabase
      .from("votos")
      .select("*", { head: true, count: "exact" })
      .eq("edicao_id", edicao.id),
    supabase
      .from("subcategorias")
      .select("*", { head: true, count: "exact" })
      .eq("edicao_id", edicao.id)
      .eq("ativa", true),
    supabase
      .from("votantes")
      .select("*", { head: true, count: "exact" })
      .eq("edicao_id", edicao.id)
      .eq("spc_validado", true),
    supabase
      .from("votantes")
      .select("*", { head: true, count: "exact" })
      .eq("edicao_id", edicao.id)
      .eq("whatsapp_validado", true),
    supabase
      .from("votantes")
      .select("*", { head: true, count: "exact" })
      .eq("edicao_id", edicao.id)
      .not("selfie_url", "is", null),
    supabase
      .rpc("numeros_campanha", { p_edicao_id: edicao.id })
      .select("ips_distintos"),
    supabase
      .rpc("numeros_campanha", { p_edicao_id: edicao.id })
      .select("dispositivos_distintos"),
  ]);

  console.log("\n=== Total votos + Anti-fraude ===");
  console.log({
    total_votos,
    subs_ativas,
    spc_validados,
    wa_validados,
    com_selfie,
    pct_spc: total_v
      ? ((spc_validados ?? 0) / total_v * 100).toFixed(1) + "%"
      : "n/a",
    pct_wa: total_v
      ? ((wa_validados ?? 0) / total_v * 100).toFixed(1) + "%"
      : "n/a",
    pct_selfie: total_v
      ? ((com_selfie ?? 0) / total_v * 100).toFixed(1) + "%"
      : "n/a",
  });

  // 8. Pico de votos em 1 dia
  const { data: votosPorDia } = await supabase
    .from("v_votos_por_dia")
    .select("dia, total")
    .eq("edicao_id", edicao.id)
    .order("total", { ascending: false })
    .limit(3);

  console.log("\n=== Top 3 dias com mais votos ===");
  console.log(votosPorDia);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
