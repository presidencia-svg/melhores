#!/usr/bin/env bash
# Configura a integracao Meta WhatsApp de ponta a ponta, pelo terminal:
#   1. grava as 6 variaveis META_* no projeto Vercel (Production)
#   2. cria os 5 templates na WABA (scripts/meta-criar-templates.mjs)
#   3. redeploy de producao
#
# Uso (na pasta do projeto):
#   bash scripts/meta-configurar.sh
#
# Pre-requisitos: node 18+ e `npx vercel login` feito uma vez
# (abre o navegador; entre com presidencia@cdlaju.com.br).
set -euo pipefail

PHONE_IDS="${META_WHATSAPP_PHONE_IDS:-1413455248515887}"
WABA_ID="${META_WABA_ID:-1340396284764555}"
SCOPE="${VERCEL_SCOPE:-cdls-projects-6f4a2205}"
PROJECT="${VERCEL_PROJECT:-melhores}"

if [ -z "${META_WHATSAPP_TOKEN:-}" ]; then
  read -r -s -p "Cole o token permanente da Meta (nao aparece ao digitar): " META_WHATSAPP_TOKEN
  echo
fi
[ -n "$META_WHATSAPP_TOKEN" ] || { echo "token vazio"; exit 1; }

echo "== Validando token na Meta"
curl -sS "https://graph.facebook.com/v21.0/$WABA_ID?fields=id,name" \
  -H "Authorization: Bearer $META_WHATSAPP_TOKEN" | grep -q '"id"' \
  || { echo "token invalido ou sem acesso a WABA $WABA_ID"; exit 1; }
echo "   ok"

echo "== Vinculando projeto Vercel ($SCOPE/$PROJECT)"
npx --yes vercel@latest link --yes --scope "$SCOPE" --project "$PROJECT" >/dev/null

set_env() { # nome valor
  # remove se existir (ignora erro) e adiciona de novo em Production
  npx --yes vercel@latest env rm "$1" production --yes >/dev/null 2>&1 || true
  printf '%s' "$2" | npx --yes vercel@latest env add "$1" production >/dev/null
  echo "   $1"
}

echo "== Gravando variaveis (Production)"
set_env META_WHATSAPP_TOKEN "$META_WHATSAPP_TOKEN"
set_env META_WHATSAPP_PHONE_IDS "$PHONE_IDS"
set_env META_WABA_ID "$WABA_ID"
set_env META_API_VERSION "v21.0"
set_env META_TEMPLATE_LANG "pt_BR"
set_env META_CURRENCY "BRL"

echo "== Criando templates na WABA $WABA_ID"
META_WHATSAPP_TOKEN="$META_WHATSAPP_TOKEN" META_WABA_ID="$WABA_ID" \
  node "$(dirname "$0")/meta-criar-templates.mjs"

echo "== Redeploy de producao"
npx --yes vercel@latest --prod --yes

echo
echo "Pronto. Quando os templates estiverem APROVADOS (WhatsApp Manager > Modelos),"
echo "teste em /admin/integracoes > Testar WhatsApp."
