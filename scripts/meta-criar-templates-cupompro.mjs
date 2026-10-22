// Cria na WABA os templates que o CUPOM PRO usa, com os mesmos nomes e
// variaveis que o codigo dele espera (src/lib/whatsapp.ts + rotas admin).
// Textos reconstruidos a partir dos templates da conta CDL Aracaju; ajuste
// a vontade antes de rodar — o que importa e' manter nome, numero de
// variaveis e os botoes.
//
// Uso:
//   META_WHATSAPP_TOKEN=... META_WABA_ID=1340396284764555 \
//     node scripts/meta-criar-templates-cupompro.mjs [--sobrescrever]
//
// Pula o que ja existe. --sobrescrever atualiza o conteudo (volta p/ analise).
// codigo_verificacao_2025 ja existe na Casa do Fio (criado p/ Melhores do Ano)
// e serve para o Cupom Pro tambem — por isso nao esta aqui.

const TOKEN = process.env.META_WHATSAPP_TOKEN;
const WABA = process.env.META_WABA_ID;
const V = process.env.META_API_VERSION ?? "v21.0";
const SITE = process.env.CUPOMPRO_SITE ?? "https://cupompro.com";
if (!TOKEN || !WABA) {
  console.error("Defina META_WHATSAPP_TOKEN e META_WABA_ID");
  process.exit(1);
}

const FOOTER = { type: "FOOTER", text: "Responda SAIR para não receber mais." };
const body = (text, example) => ({ type: "BODY", text, example: { body_text: [example] } });
const urlBtn = (text, url, example) => ({ type: "BUTTONS", buttons: [{ type: "URL", text, url, example: [example] }] });

const templates = [
  // META_TEMPLATE_ACCESS — {{1}} nome · botao URL ?t={{1}} token
  {
    name: "acesso_cupompro", category: "UTILITY", language: "pt_BR",
    components: [
      body("Olá {{1}}! Seu acesso ao Cupom Pro está pronto. Toque no botão abaixo para criar sua senha e começar a usar seus cupons.", ["Maria"]),
      urlBtn("Criar senha", `${SITE}/criar-senha?t={{1}}`, `${SITE}/criar-senha?t=abc123`),
    ],
  },
  // META_TEMPLATE_VOUCHER — {{1}} nome {{2}} valor {{3}} codigo {{4}} prazo
  {
    name: "voucher_premio", category: "UTILITY", language: "pt_BR",
    components: [
      body("🎉 {{1}}, você ganhou {{2}}! Seu voucher é *{{3}}*. Apresente este código em uma loja participante até {{4}}. Boas compras!", ["Maria", "R$ 100,00", "VP-7K2M9", "28/02/2027"]),
    ],
  },
  // META_TEMPLATE_PIX — {{1}} nome {{2}} valor · botao URL ?t={{1}} token
  {
    name: "premio_pix_2025", category: "UTILITY", language: "pt_BR",
    components: [
      body("Parabéns, {{1}}! Você ganhou {{2}} na promoção. Para receber o prêmio, toque no botão e informe sua chave PIX.", ["Maria", "R$ 50,00"]),
      urlBtn("Informar chave PIX", `${SITE}/premio/pix?t={{1}}`, `${SITE}/premio/pix?t=abc123`),
    ],
  },
  // META_TEMPLATE_PESQUISA — {{1}} nome {{2}} link
  {
    name: "pesquisa_cupompro", category: "MARKETING", language: "pt_BR",
    components: [
      body("📋 Olá, {{1}}! Sua opinião vale muito para nós. Responda à nossa pesquisa rápida, leva menos de 2 minutos: {{2}}", ["Maria", "https://cupompro.com/p/abc123"]),
      FOOTER,
    ],
  },
  // META_TEMPLATE_SORTEIO_REMINDER — {{1}} nome {{2}} campanha {{3}} data {{4}} hora {{5}} local
  {
    name: "lembrete_sorteio", category: "MARKETING", language: "pt_BR",
    components: [
      body("🍀 Olá, {{1}}! O sorteio da campanha *{{2}}* está chegando!\n📅 {{3}} · 🕐 {{4}}\n📍 {{5}}\n\nQuanto mais cupons, mais chances. Boa sorte!", ["Maria", "Liquida Aju 2026", "30/11/2026", "19h", "Shopping Jardins"]),
      FOOTER,
    ],
  },
  // META_TEMPLATE_RESULTADO — {{1}} nome {{2}} campanha
  {
    name: "resultado_sorteio", category: "MARKETING", language: "pt_BR",
    components: [
      body("🏆 Olá, {{1}}! Saiu o resultado do sorteio da campanha *{{2}}*. Abra o app e confira a lista de ganhadores!", ["Maria", "Liquida Aju 2026"]),
      FOOTER,
    ],
  },
  // META_TEMPLATE_SUPPLIER_BROADCAST — {{1}} campanha {{2}} CDL {{3}} link {{4}} telefone
  {
    name: "meta_template_supplier_broadcast", category: "MARKETING", language: "pt_BR",
    components: [
      body("📣 A campanha {{1}} da {{2}} está no ar! Cadastre sua loja e comece a emitir cupons para seus clientes: {{3}}\n\nDúvidas? Fale com a gente: {{4}}", ["Liquida Aju 2026", "CDL Aracaju", "https://cupompro.com/c/liquida", "(79) 99999-0000"]),
      FOOTER,
    ],
  },
  // META_TEMPLATE_SUPPLIER_BROADCAST2 — {{1}} campanha {{2}} @instagram
  {
    name: "meta_template_supplier_broadcast2", category: "MARKETING", language: "pt_BR",
    components: [
      body("Olá! 👋 A {{1}} está bombando nas redes. Ajude a divulgar: siga, curta e compartilhe os posts de {{2}}. Quanto mais gente souber, mais clientes na sua loja!", ["Liquida Aju 2026", "@cdlaracaju"]),
      FOOTER,
    ],
  },
  // META_TEMPLATE_WELCOME — {{1}} nome {{2}} campanha · botao URL wa.me/?text={{1}}
  {
    name: "boas_vindas_campanha", category: "MARKETING", language: "pt_BR",
    components: [
      body("Olá {{1}}! Cadastro confirmado na campanha *{{2}}*. A cada compra nas lojas participantes você ganha cupons para o sorteio. Chame seus amigos pelo botão abaixo!", ["Maria", "Liquida Aju 2026"]),
      urlBtn("Convidar amigos", "https://wa.me/?text={{1}}", "https://wa.me/?text=Participe"),
      FOOTER,
    ],
  },
  // META_TEMPLATE_INVITE — sem variaveis
  {
    name: "convite_cadastro", category: "MARKETING", language: "pt_BR",
    components: [
      { type: "BODY", text: "Você foi cadastrado no Cupom Pro! Acesse cupompro.com, crie sua senha e comece a concorrer aos prêmios das campanhas participantes." },
      FOOTER,
    ],
  },
  // META_TEMPLATE_CONSUMER_BROADCAST — {{1}} nome {{2}} campanha {{3}} mensagem
  {
    name: "aviso_consumidores", category: "MARKETING", language: "pt_BR",
    components: [
      body("Olá, {{1}}! Novidade da campanha *{{2}}*: {{3}}", ["Maria", "Liquida Aju 2026", "últimos dias para trocar suas notas por cupons"]),
      FOOTER,
    ],
  },
];

const SOBRESCREVER = process.argv.includes("--sobrescrever");
const base = `https://graph.facebook.com/${V}/${WABA}/message_templates`;
const auth = { Authorization: `Bearer ${TOKEN}` };
const existing = await fetch(`${base}?fields=id,name,status,language&limit=200`, { headers: auth }).then((r) => r.json());
if (existing.error) { console.error(existing.error.message); process.exit(1); }
const have = new Map((existing.data ?? []).map((t) => [`${t.name}:${t.language}`, t]));

for (const t of templates) {
  const cur = have.get(`${t.name}:${t.language}`);
  if (cur && !SOBRESCREVER) { console.log(`= ${t.name} já existe (${cur.status})`); continue; }
  const url = cur ? `https://graph.facebook.com/${V}/${cur.id}` : base;
  const payload = cur ? { category: t.category, components: t.components } : t;
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...auth }, body: JSON.stringify(payload) });
  const j = await r.json();
  if (j.error) console.log(`x ${t.name}: ${j.error.error_user_msg ?? j.error.message}`);
  else console.log(`${cur ? "~" : "+"} ${t.name}: ${cur ? "atualizado" : "criado"} (${j.status ?? "PENDING"})`);
}

console.log(`
Depois de APROVADOS, na Vercel do cupompro (Production):
  META_WABA_ID=${WABA}
  META_WHATSAPP_PHONE_IDS=1346961145176922
  META_WHATSAPP_TOKEN=<token da Casa do Fio>
  META_TEMPLATE_OTP=codigo_verificacao_2025
  META_TEMPLATE_ACCESS=acesso_cupompro
  META_TEMPLATE_VOUCHER=voucher_premio
  META_TEMPLATE_PIX=premio_pix_2025
  META_TEMPLATE_PESQUISA=pesquisa_cupompro
  META_TEMPLATE_SORTEIO_REMINDER=lembrete_sorteio
  META_TEMPLATE_RESULTADO=resultado_sorteio
  META_TEMPLATE_SUPPLIER_BROADCAST=meta_template_supplier_broadcast
  META_TEMPLATE_SUPPLIER_BROADCAST2=meta_template_supplier_broadcast2
  META_TEMPLATE_WELCOME=boas_vindas_campanha
  META_TEMPLATE_INVITE=convite_cadastro
  META_TEMPLATE_CONSUMER_BROADCAST=aviso_consumidores`);
