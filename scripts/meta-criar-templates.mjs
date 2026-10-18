// Cria na WABA os 5 templates que o sistema usa (nomes default do codigo).
// Uso:
//   META_WHATSAPP_TOKEN=... META_WABA_ID=... node scripts/meta-criar-templates.mjs
// Idempotente: se o template ja existe, pula. Aprovacao da Meta costuma
// levar minutos; acompanhe em WhatsApp Manager > Modelos de mensagem.

const TOKEN = process.env.META_WHATSAPP_TOKEN;
const WABA = process.env.META_WABA_ID;
const V = process.env.META_API_VERSION ?? "v21.0";
const ORGAO = process.env.META_TEMPLATE_ORGAO ?? "Melhores do Ano";
if (!TOKEN || !WABA) {
  console.error("Defina META_WHATSAPP_TOKEN e META_WABA_ID");
  process.exit(1);
}

const FOOTER = { type: "FOOTER", text: "Responda SAIR para não receber mais." };

const templates = [
  {
    name: process.env.META_TEMPLATE_OTP ?? "codigo_verificacao_2025",
    category: "AUTHENTICATION",
    language: "pt_BR",
    components: [
      { type: "BODY", add_security_recommendation: true },
      { type: "FOOTER", code_expiration_minutes: 10 },
      { type: "BUTTONS", buttons: [{ type: "OTP", otp_type: "COPY_CODE", text: "Copiar código" }] },
    ],
  },
  {
    name: process.env.META_TEMPLATE_PARCIAL ?? "parcial_voto_2025",
    category: "MARKETING",
    language: "pt_BR",
    components: [
      {
        type: "BODY",
        text: `Oi {{1}}! Parcial do ${ORGAO} em *{{2}}*:\n🥇 {{3}} com {{4}}%\n🥈 {{5}} com {{6}}%\n\nCompartilhe o link de votação e ajude quem você escolheu a vencer.`,
        example: { body_text: [["Maria", "Restaurante", "Cariri Cabaña", "41", "Cacique Chá", "38"]] },
      },
      FOOTER,
    ],
  },
  {
    name: process.env.META_TEMPLATE_INCENTIVO ?? "incentivo_voto_2025",
    category: "MARKETING",
    language: "pt_BR",
    components: [
      {
        type: "BODY",
        text: `{{1}}, *{{2}}* está perdendo em *{{3}}* para {{4}} por {{5}}. Já são {{6}} votos na disputa e faltam {{7}} para o fim da votação. Chame seus amigos para votar!`,
        example: { body_text: [["Maria", "Cacique Chá", "Restaurante", "Cariri Cabaña", "3 votos", "120", "2 dias"]] },
      },
      FOOTER,
    ],
  },
  {
    name: process.env.META_TEMPLATE_INCENTIVO_EMPATE ?? "incentivo_empate_2025",
    category: "MARKETING",
    language: "pt_BR",
    components: [
      {
        type: "BODY",
        text: `{{1}}, *{{2}}* está empatado em *{{3}}* com {{4}}! Já são {{5}} votos na disputa e faltam {{6}} para o fim da votação. Cada voto decide.`,
        example: { body_text: [["Maria", "Cacique Chá", "Restaurante", "Cariri Cabaña", "120", "2 dias"]] },
      },
      FOOTER,
    ],
  },
  {
    name: process.env.META_TEMPLATE_CERIMONIA ?? "cerimonia_certificados_2025",
    category: "MARKETING",
    language: "pt_BR",
    components: [
      {
        type: "BODY",
        text: `{{1}}, você votou em campeão! {{2}} venceu no ${ORGAO}. A entrega dos certificados será na cerimônia de premiação. Confira data e local no site.`,
        example: { body_text: [["Maria", "Cariri Cabaña (Restaurante)"]] },
      },
      FOOTER,
    ],
  },
];

const base = `https://graph.facebook.com/${V}/${WABA}/message_templates`;
const auth = { Authorization: `Bearer ${TOKEN}` };
const existing = await fetch(`${base}?fields=name,status,language&limit=200`, { headers: auth }).then((r) => r.json());
const have = new Map((existing.data ?? []).map((t) => [`${t.name}:${t.language}`, t.status]));

for (const t of templates) {
  const key = `${t.name}:${t.language}`;
  if (have.has(key)) {
    console.log(`= ${t.name} já existe (${have.get(key)})`);
    continue;
  }
  const r = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify(t),
  });
  const j = await r.json();
  if (j.error) console.log(`x ${t.name}: ${j.error.error_user_msg ?? j.error.message}`);
  else console.log(`+ ${t.name}: criado (${j.status ?? "PENDING"}) id=${j.id}`);
}
