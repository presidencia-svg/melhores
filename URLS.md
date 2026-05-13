# URLs · Melhores do Ano

Mapa completo de domínios e rotas do projeto.

---

## 🌐 Domínios em produção

| Domínio | Uso | Status |
|---|---|---|
| `melhoresdoano.app.br` | SaaS landing + cadastro de novos tenants | ✅ |
| `*.melhoresdoano.app.br` | Subdomínio automático por tenant (wildcard) | ⏳ wildcard pendente |
| `votar.cdlaju.com.br` | Tenant CDL Aracaju (domínio custom) | ✅ |
| `melhores-phi.vercel.app` | Default da Vercel (fallback técnico) | ✅ |

---

## 🏠 Páginas públicas (qualquer tenant)

| URL | Função |
|---|---|
| `/` | Landing page do tenant |
| `/cadastrar` | Auto-cadastro de nova organização (cria tenant + admin) |
| `/cadastrar/sucesso` | Confirmação pós-cadastro |
| `/kit` | Kit de comunicação (assets, badges, frases) |
| `/privacidade` | Política de privacidade |
| `/regulamento` | Regulamento da votação |
| `/termos` | Termos de uso |

### Fluxo de votação
| URL | Função |
|---|---|
| `/votar` | Início — cadastro CPF + selfie |
| `/votar/selfie` | Captura de selfie |
| `/votar/categorias` | Lista de categorias |
| `/votar/c/[categoria]/[subcategoria]` | Voto em subcategoria |
| `/votar/completar` | Completar dados (WhatsApp) |
| `/votar/finalizar` | Confirmar voto |
| `/votar/obrigado` | Tela de agradecimento |
| `/votar/retornar` | Retomar voto incompleto |

---

## 🔐 Painel administrativo do tenant

`/admin` (protegido por login + opcionalmente TOTP)

| URL | Função |
|---|---|
| `/admin/login` | Login do admin |
| `/admin` | Dashboard geral |
| `/admin/categorias` | CRUD categorias/subcategorias |
| `/admin/candidatos` | CRUD candidatos + merge + import |
| `/admin/sugestoes` | Sugestões de candidatos pendentes |
| `/admin/votantes` | Lista de votantes + filtros |
| `/admin/resultados` | Resultado por subcategoria |
| `/admin/duelos` | Duelos manuais (resolver empates) |
| `/admin/podium` | Pódio 1º/2º/3º + posts Instagram |
| `/admin/certificados` | Gera PDF dos certificados de premiação |
| `/admin/convites` | Gera convites pra festa |
| `/admin/imprensa` | Release pra imprensa (top 6) |
| `/admin/whatsapp` | Disparos WhatsApp (parcial, incentivo, cerimônia) |
| `/admin/whatsapp/insights` | Insights dos disparos |
| `/admin/seguranca` | Configurações de segurança + TOTP |
| `/admin/onboarding` | Onboarding inicial pós-cadastro |
| `/admin/marca` | Branding/logo do tenant |
| `/admin/creditos` | Saldo + extrato de mensagens |
| `/admin/creditos/comprar` | Comprar créditos WhatsApp |
| `/admin/creditos/sucesso` | Confirmação de compra |

---

## 👑 Super-Admin (gerencia todos tenants)

`/super` (acesso restrito ao operador do SaaS)

| URL | Função |
|---|---|
| `/super/login` | Login super-admin |
| `/super` | Dashboard de tenants |
| `/super/tenants` | Lista de todos os tenants |
| `/super/tenants/[id]` | Detalhe + ações por tenant (cortesia, créditos, etc.) |

---

## 🔌 APIs principais

### Públicas
- `POST /api/cadastrar` — cria novo tenant + admin
- `POST /api/voto` — registra voto
- `POST /api/identificar` — identifica votante (CPF)
- `POST /api/selfie` — upload selfie
- `POST /api/sugerir-candidato` — sugestão de candidato
- `POST /api/whatsapp/enviar-codigo` — OTP de validação
- `POST /api/whatsapp/validar` — valida OTP

### Admin
- `/api/admin/login`, `/api/admin/logout`
- `/api/admin/whatsapp/parcial/*` — disparo parcial
- `/api/admin/whatsapp/incentivo/*` — disparo de incentivo
- `/api/admin/whatsapp/cerimonia/*` — disparo cerimônia de entrega
- `/api/admin/whatsapp/exportar` — exporta CSV
- `/api/admin/instagram/postar` — publica carrossel

### Geração de imagens (Open Graph)
- `/api/img/banner`
- `/api/img/cerimonia`
- `/api/img/convite`
- `/api/img/eu-votei`
- `/api/img/feed`
- `/api/img/story`

### Cron
- `/api/cron/parcial` — disparo automático de parcial
- `/api/cron/incentivo-empate` — incentivo em subcategorias acirradas
- `/api/cron/limpar-fantasmas` — limpeza de cadastros incompletos
- `/api/cron/alertas-saldo` — alerta de saldo baixo

---

## 🔗 Painéis externos

| Painel | URL | Conta |
|---|---|---|
| Vercel | https://vercel.com/cdls-projects-6f4a2205/melhores | team CDL |
| Cloudflare DNS | https://dash.cloudflare.com/67b1cc6f1f9ec3deabd8872a0a44083a/melhoresdoano.app.br | Prainhatur@gmail.com |
| Supabase | https://supabase.com/dashboard/project/... | — |
| Registro.br | https://registro.br | elison@mistao.com.br |
| Meta Business Manager | https://business.facebook.com | — |
| GitHub | https://github.com/presidencia-svg/melhores | — |

---

## 🧪 Subdomínios de teste atuais (Cloudflare)

Existem CNAMEs configurados pra: `teste1`, `teste3`, `teste4`, `teste5`, `teste6`, `socorro` — todos apontando pra `cname.vercel-dns.com`. Apenas `teste5` e `teste6` estão adicionados como domínios no projeto Vercel. Os demais ficam órfãos.

Quando o wildcard `*` for adicionado, esses CNAMEs específicos podem ser deletados (o wildcard cobre tudo).
