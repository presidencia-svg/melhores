# Conta Meta WhatsApp "Melhores do Ano" — roteiro de criação

Objetivo: ter uma conta WhatsApp Business Platform (Cloud API) própria da
plataforma Melhores do Ano, separada da CDL Aracaju, para enviar OTP,
parcial, incentivo e cerimônia direto pela API da Meta.

O código já está pronto para isso (`lib/meta-whatsapp/client.ts`). Falta só
a conta, o número, os templates aprovados e as variáveis de ambiente.

---

## 1. Antes de começar — ter em mãos

- CNPJ da empresa que vai responder pela conta (EB Serviços / Cupom Pro ou
  a que for dona da plataforma) + cartão CNPJ em PDF.
- Login pessoal no Facebook de quem será admin (precisa de 2FA ativado).
- **Chip novo, dedicado**, que nunca foi usado no WhatsApp comum nem no
  WhatsApp Business app. Recomendado: 2 chips (um reserva para o round-robin).
- Cartão de crédito internacional ou conta Meta Business com cobrança
  habilitada para o Brasil (cobrança é por conversa, em USD).
- Site público da plataforma (melhoresdoano.app.br) e e-mail no mesmo
  domínio (ex.: contato@melhoresdoano.app.br) — a verificação da empresa
  pede os dois.

## 2. Criar o Business Manager

1. https://business.facebook.com → **Criar conta** → nome "Melhores do Ano",
   seu nome, e-mail do domínio.
2. **Configurações do negócio → Informações da empresa** → preencher razão
   social, CNPJ, endereço e site.
3. **Central de segurança → Verificação da empresa** → enviar cartão CNPJ.
   Leva de 1 a 5 dias úteis. Sem isso o número fica limitado a 250
   conversas/dia.

## 3. Criar o app e a conta WhatsApp (WABA)

1. https://developers.facebook.com/apps → **Criar app** → tipo **Empresa**,
   nome "Melhores do Ano", vincular ao Business Manager do passo 2.
2. No painel do app → **Adicionar produto → WhatsApp → Configurar**.
3. **Configuração da API → Adicionar número de telefone**: nome de exibição
   "Melhores do Ano", categoria "Outros", número do chip dedicado, confirmar
   por SMS.
4. Anotar:
   - **Phone number ID** (fica abaixo do número) → `META_WHATSAPP_PHONE_IDS`
   - **WhatsApp Business Account ID** → `META_WABA_ID`
5. **Configurações da conta WhatsApp → Forma de pagamento** → cadastrar o
   cartão. Sem pagamento, só números de teste funcionam.

## 4. Token permanente (System User)

Não usar o token temporário de 24h do painel.

1. Business Manager → **Configurações → Usuários → Usuários do sistema →
   Adicionar** → nome "melhores-api", função **Admin**.
2. **Adicionar ativos** → o app "Melhores do Ano" (controle total) e a conta
   WhatsApp (controle total).
3. **Gerar novo token** → app "Melhores do Ano", expiração **Nunca**,
   permissões `whatsapp_business_messaging` e `whatsapp_business_management`.
4. Copiar o token → `META_WHATSAPP_TOKEN`. Ele só aparece uma vez.

## 5. Templates (precisam ser aprovados antes de usar)

Atalho: o script `scripts/meta-criar-templates.mjs` cria os 5 templates
abaixo pela API, já com os textos sugeridos. Rodar no seu computador:

```bash
META_WHATSAPP_TOKEN=<token> META_WABA_ID=<waba id> node scripts/meta-criar-templates.mjs
```

Ele pula o que já existe. Se preferir criar à mão, siga a tabela.


Criar em **WhatsApp Manager → Ferramentas da conta → Modelos de mensagem**,
idioma **Português (BR)**. Os nomes abaixo são os defaults do código; se
usar outro nome, ajuste a env correspondente.

| Nome (env) | Categoria | Variáveis no corpo | Observação |
|---|---|---|---|
| `codigo_verificacao_2025` (`META_TEMPLATE_OTP`) | **Autenticação** | `{{1}}` código | Marcar "Adicionar botão Copiar código". Meta gera o texto; não editar. |
| `parcial_voto_2025` (`META_TEMPLATE_PARCIAL`) | Marketing | 6: nome, subcategoria, 1º candidato, % 1º, 2º candidato, % 2º | |
| `incentivo_voto_2025` (`META_TEMPLATE_INCENTIVO`) | Marketing | 7: nome, candidato que perde, subcategoria, líder, diferença, votos, dias restantes | |
| `incentivo_empate_2025` (`META_TEMPLATE_INCENTIVO_EMPATE`) | Marketing | 6: nome, candidato, subcategoria, líder, votos, dias restantes | igual ao anterior sem "diferença" |
| `cerimonia_certificados_2025` (`META_TEMPLATE_CERIMONIA`) | Marketing | 2: nome, lista de campeões | |

Textos sugeridos para os de marketing (adaptar ao tom da plataforma):

**parcial_voto_2025**
> Oi {{1}}! Parcial do Melhores do Ano em *{{2}}*: 🥇 {{3}} com {{4}}% · 🥈 {{5}} com {{6}}%. Compartilhe o link e ajude quem você escolheu a vencer.

**incentivo_voto_2025**
> {{1}}, *{{2}}* está perdendo em *{{3}}* para {{4}} por {{5}}. São {{6}} votos de diferença e faltam {{7}}. Chame seus amigos para votar!

**incentivo_empate_2025**
> {{1}}, *{{2}}* está empatado em *{{3}}* com {{4}}! São {{5}} votos cada e faltam {{6}}. Cada voto decide.

**cerimonia_certificados_2025**
> {{1}}, você votou em campeão! {{2}} venceu no Melhores do Ano. A entrega dos certificados é na cerimônia de premiação. Confira detalhes no site.

Aprovação costuma sair em minutos; rejeição mais comum é texto com
variável no início ou no fim do corpo.

## 6. Variáveis de ambiente (Vercel → Settings → Environment Variables)

```bash
META_WHATSAPP_TOKEN=            # token do System User (passo 4)
META_WHATSAPP_PHONE_IDS=        # phone number id(s), separados por vírgula
META_WABA_ID=                   # WhatsApp Business Account ID (insights)
META_API_VERSION=v21.0
META_CURRENCY=BRL               # se a cobrança foi configurada em reais
META_TEMPLATE_LANG=pt_BR
# só se os nomes dos templates forem diferentes dos defaults:
# META_TEMPLATE_OTP=codigo_verificacao_2025
# META_TEMPLATE_PARCIAL=parcial_voto_2025
# META_TEMPLATE_INCENTIVO=incentivo_voto_2025
# META_TEMPLATE_INCENTIVO_EMPATE=incentivo_empate_2025
# META_TEMPLATE_CERIMONIA=cerimonia_certificados_2025
```

Depois de salvar, **Redeploy** do projeto na Vercel.

Multi-tenant: hoje todos os tenants usam o número default das envs. Para dar
um número próprio a um cliente, preencher `tenants.meta_phone_number_id`
com o Phone number ID dele (o número precisa estar na mesma WABA, ou em
WABA acessível pelo mesmo token).

## 7. Testar

1. `/admin/integracoes` → botão **Testar WhatsApp** (envia o template de OTP
   para o número informado).
2. `/admin/whatsapp/insights` → deve listar a conta e os custos quando
   `META_WABA_ID` estiver certo.
3. `/api/admin/meta-debug` (logado como admin) mostra o diagnóstico cru.

## 8. Limites de envio (importante para 100 mil eleitores)

A Meta libera conversas por dia conforme a qualidade do número:

| Nível | Conversas/dia | Como subir |
|---|---:|---|
| Inicial (sem verificação) | 250 | verificar a empresa |
| Nível 1 | 1.000 | enviar ~500 em 7 dias com qualidade alta |
| Nível 2 | 10.000 | idem, mais 7 dias |
| Nível 3 | 100.000 | idem |
| Ilimitado | — | automático após nível 3 |

Para 100 mil OTPs em poucos dias, usar **2 a 4 números** no
`META_WHATSAPP_PHONE_IDS` (o código faz round-robin) e começar os envios de
parcial com volume baixo na primeira semana para aquecer os números.

## 9. Custos de referência (Brasil, USD, tabela pública da Meta)

| Categoria | Valor por mensagem | Uso aqui |
|---|---:|---|
| Autenticação | ~US$ 0,0315 | OTP |
| Marketing | ~US$ 0,0625 | parcial, incentivo, cerimônia |
| Utilidade | ~US$ 0,008 | não usado hoje |

Conferir o valor vigente em **WhatsApp Manager → Visão geral → Preços**.
