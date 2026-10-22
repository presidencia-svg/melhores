// Cria na WABA os 5 templates que o sistema usa (nomes default do codigo).
// Uso:
//   META_WHATSAPP_TOKEN=... META_WABA_ID=... node scripts/meta-criar-templates.mjs
// Se o template ja existe, pula. Com --sobrescrever (ou META_SOBRESCREVER=1)
// atualiza o conteudo do existente pela API (mantendo o mesmo nome e id) —
// a Meta coloca o template de volta em analise. Templates PENDING nao podem
// ser editados; esses sao pulados. Nao apaga nada: nome apagado fica
// bloqueado por 30 dias na Meta.
// Aprovacao costuma levar minutos; acompanhe em WhatsApp Manager > Modelos.

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
        text: `Olá {{1}}! *{{2}}* está perdendo em *{{3}}* para {{4}} por {{5}}. Já são {{6}} votos na disputa e faltam {{7}} para o fim da votação. Chame seus amigos para votar!`,
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
        text: `Olá {{1}}! *{{2}}* está empatado em *{{3}}* com {{4}}! Já são {{5}} votos na disputa e faltam {{6}} para o fim da votação. Cada voto decide.`,
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
        text: `Olá {{1}}! Você votou em campeão. {{2}} venceu no ${ORGAO}. A entrega dos certificados será na cerimônia de premiação. Confira data e local no site.`,
        example: { body_text: [["Maria", "Cariri Cabaña (Restaurante)"]] },
      },
      FOOTER,
    ],
  },
];

const base = `https://graph.facebook.com/${V}/${WABA}/message_templates`;
const auth = { Authorization: `Bearer ${TOKEN}` };
const SOBRESCREVER = process.argv.includes("--sobrescrever") || process.env.META_SOBRESCREVER === "1";
const existing = await fetch(`${base}?fields=id,name,status,language&limit=200`, { headers: auth }).then((r) => r.json());
const have = new Map((existing.data ?? []).map((t) => [`${t.name}:${t.language}`, t]));

for (const t of templates) {
  const key = `${t.name}:${t.language}`;
  const cur = have.get(key);
  if (cur && !SOBRESCREVER) {
    console.log(`= ${t.name} já existe (${cur.status}) — use --sobrescrever para atualizar`);
    continue;
  }
  if (cur) {
    if (cur.status === "PENDING" || cur.status === "IN_APPEAL") {
      console.log(`= ${t.name} está em análise (${cur.status}); não pode ser editado agora`);
      continue;
    }
    const r = await fetch(`https://graph.facebook.com/${V}/${cur.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ category: t.category, components: t.components }),
    });
    const j = await r.json();
    if (j.error) console.log(`x ${t.name}: ${j.error.error_user_msg ?? j.error.message}`);
    else console.log(`~ ${t.name}: atualizado (volta para análise) id=${cur.id}`);
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
