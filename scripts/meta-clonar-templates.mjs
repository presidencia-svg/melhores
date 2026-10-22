// Clona templates aprovados de uma WABA (origem) para outra (destino).
// Util quando um sistema (ex.: Cupom Pro) ganha um numero novo em outra
// conta WhatsApp Business e precisa dos mesmos templates la.
//
// Uso:
//   META_WHATSAPP_TOKEN=<token com acesso as DUAS contas> \
//   ORIGEM_WABA_ID=<waba antiga> DESTINO_WABA_ID=<waba nova> \
//   node scripts/meta-clonar-templates.mjs [--so nome1,nome2] [--dry-run]
//
// Se as contas estao em portfolios diferentes (um token nao le as duas),
// passe um token por conta:
//   ORIGEM_TOKEN=<token do portfolio antigo> DESTINO_TOKEN=<token do novo> ...
//
// - Copia nome, idioma, categoria e componentes (header/body/footer/buttons).
// - Pula o que ja existe no destino (mesmo nome + idioma).
// - So clona templates APPROVED na origem.
// - Nao apaga nada. O destino entra em analise na Meta (minutos a horas).
// - Se o token nao enxergar a origem, gere um token no Business que e' dono
//   dela, ou adicione a WABA de origem aos ativos do usuario do sistema.

const ORIGEM = process.env.ORIGEM_WABA_ID;
const DESTINO = process.env.DESTINO_WABA_ID;
const TOKEN_ORIGEM = process.env.ORIGEM_TOKEN ?? process.env.META_WHATSAPP_TOKEN;
const TOKEN_DESTINO = process.env.DESTINO_TOKEN ?? process.env.META_WHATSAPP_TOKEN;
const V = process.env.META_API_VERSION ?? "v21.0";
if (!TOKEN_ORIGEM || !TOKEN_DESTINO || !ORIGEM || !DESTINO) {
  console.error("Defina ORIGEM_WABA_ID, DESTINO_WABA_ID e o(s) token(s): META_WHATSAPP_TOKEN ou ORIGEM_TOKEN + DESTINO_TOKEN");
  process.exit(1);
}
const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const soIdx = args.indexOf("--so");
const SO = soIdx >= 0 ? new Set((args[soIdx + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean)) : null;

const authOrigem = { Authorization: `Bearer ${TOKEN_ORIGEM}` };
const authDestino = { Authorization: `Bearer ${TOKEN_DESTINO}` };
const fields = "id,name,status,category,language,components";

async function listar(waba, auth) {
  const out = [];
  let url = `https://graph.facebook.com/${V}/${waba}/message_templates?fields=${fields}&limit=100`;
  while (url) {
    const j = await fetch(url, { headers: auth }).then((r) => r.json());
    if (j.error) throw new Error(`${waba}: ${j.error.message}`);
    out.push(...(j.data ?? []));
    url = j.paging?.next ?? null;
  }
  return out;
}

// A API devolve os componentes com campos extras que o POST nao aceita.
// Mantem so o que e' necessario pra recriar.
function limparComponentes(components, category) {
  return components.map((c) => {
    const t = c.type;
    if (t === "HEADER") {
      if (c.format === "TEXT") {
        const h = { type: "HEADER", format: "TEXT", text: c.text };
        if (c.example?.header_text) h.example = { header_text: c.example.header_text };
        return h;
      }
      // Header de midia precisa de um upload novo (handle); nao da pra clonar.
      return { type: "HEADER", format: c.format, _nao_clonavel: true };
    }
    if (t === "BODY") {
      if (category === "AUTHENTICATION") {
        const b = { type: "BODY" };
        if (c.add_security_recommendation) b.add_security_recommendation = true;
        return b;
      }
      const b = { type: "BODY", text: c.text };
      if (c.example?.body_text) b.example = { body_text: c.example.body_text };
      return b;
    }
    if (t === "FOOTER") {
      if (category === "AUTHENTICATION") {
        const f = { type: "FOOTER" };
        if (c.code_expiration_minutes) f.code_expiration_minutes = c.code_expiration_minutes;
        return f;
      }
      return { type: "FOOTER", text: c.text };
    }
    if (t === "BUTTONS") {
      return {
        type: "BUTTONS",
        buttons: (c.buttons ?? []).map((b) => {
          if (b.type === "OTP") return { type: "OTP", otp_type: b.otp_type ?? "COPY_CODE", text: b.text };
          if (b.type === "URL") {
            const u = { type: "URL", text: b.text, url: b.url };
            if (b.example) u.example = b.example;
            return u;
          }
          if (b.type === "PHONE_NUMBER") return { type: "PHONE_NUMBER", text: b.text, phone_number: b.phone_number };
          if (b.type === "QUICK_REPLY") return { type: "QUICK_REPLY", text: b.text };
          return b;
        }),
      };
    }
    return c;
  });
}

const origem = (await listar(ORIGEM, authOrigem)).filter((t) => t.status === "APPROVED");
const destino = await listar(DESTINO, authDestino);
const jaTem = new Set(destino.map((t) => `${t.name}:${t.language}`));

console.log(`origem ${ORIGEM}: ${origem.length} aprovados · destino ${DESTINO}: ${destino.length} existentes${DRY ? " · DRY RUN" : ""}`);

for (const t of origem) {
  if (SO && !SO.has(t.name)) continue;
  const key = `${t.name}:${t.language}`;
  if (jaTem.has(key)) {
    console.log(`= ${t.name} (${t.language}) já existe no destino`);
    continue;
  }
  const components = limparComponentes(t.components ?? [], t.category);
  if (components.some((c) => c._nao_clonavel)) {
    console.log(`! ${t.name}: header de mídia, precisa recriar à mão no WhatsApp Manager`);
    continue;
  }
  const body = { name: t.name, language: t.language, category: t.category, components };
  if (DRY) {
    console.log(`~ ${t.name} (${t.category}, ${t.language}) seria criado`);
    continue;
  }
  const r = await fetch(`https://graph.facebook.com/${V}/${DESTINO}/message_templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authDestino },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (j.error) console.log(`x ${t.name}: ${j.error.error_user_msg ?? j.error.message}`);
  else console.log(`+ ${t.name}: criado (${j.status ?? "PENDING"}) id=${j.id}`);
}
