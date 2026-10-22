#!/usr/bin/env bash
# Aponta o projeto Vercel "cupompro" para a conta WhatsApp Casa do Fio:
# grava as 15 variaveis META_* em Production e faz redeploy.
#
# Rodar SO depois que os templates estiverem APROVADOS na WABA 1340396284764555.
#
# Uso:  bash scripts/vercel-cupompro-meta.sh
# Pede o token da Casa do Fio (nao aparece ao digitar).
set -euo pipefail

SCOPE="prainhatur-lang"
PROJECT="cupompro"
WABA="1340396284764555"
PHONE="1346961145176922"

if [ -z "${DESTINO_TOKEN:-}" ]; then
  read -r -s -p "Token da Casa do Fio: " DESTINO_TOKEN; echo
fi
[ -n "$DESTINO_TOKEN" ] || { echo "token vazio"; exit 1; }

echo "== Validando token"
curl -sS "https://graph.facebook.com/v21.0/$WABA?fields=id" -H "Authorization: Bearer $DESTINO_TOKEN" | grep -q '"id"' \
  || { echo "token nao acessa a WABA $WABA"; exit 1; }

# Vincula o projeto numa pasta temporaria (nao precisa do codigo do cupompro)
LINK_DIR="$(mktemp -d)"
echo "== Vinculando $SCOPE/$PROJECT"
npx --yes vercel@latest link --yes --scope "$SCOPE" --project "$PROJECT" --cwd "$LINK_DIR" >/dev/null

v() { npx --yes vercel@latest "$@" --cwd "$LINK_DIR"; }

set_env() {
  v env rm "$1" production --yes >/dev/null 2>&1 || true
  printf '%s' "$2" | v env add "$1" production >/dev/null
  echo "   $1"
}

echo "== Gravando variaveis (Production)"
set_env META_WABA_ID "$WABA"
set_env META_WHATSAPP_PHONE_IDS "$PHONE"
set_env META_WHATSAPP_TOKEN "$DESTINO_TOKEN"
set_env META_TEMPLATE_OTP codigo_verificacao_2025
set_env META_TEMPLATE_ACCESS acesso_cupompro
set_env META_TEMPLATE_VOUCHER voucher_premio
set_env META_TEMPLATE_PIX premio_pix_2025
set_env META_TEMPLATE_PESQUISA pesquisa_cupompro
set_env META_TEMPLATE_SORTEIO_REMINDER lembrete_sorteio
set_env META_TEMPLATE_RESULTADO resultado_sorteio
set_env META_TEMPLATE_SUPPLIER_BROADCAST meta_template_supplier_broadcast
set_env META_TEMPLATE_SUPPLIER_BROADCAST2 meta_template_supplier_broadcast2
set_env META_TEMPLATE_WELCOME boas_vindas_campanha
set_env META_TEMPLATE_INVITE convite_cadastro
set_env META_TEMPLATE_CONSUMER_BROADCAST aviso_consumidores

echo "== Redeploy do ultimo deploy de producao"
URL="$(v ls --prod 2>/dev/null | grep -oE 'https://[^ ]+' | head -1 || true)"
if [ -n "$URL" ]; then
  v redeploy "$URL" --yes
else
  echo "   Nao achei o deploy; clique em Redeploy no painel da Vercel."
fi
rm -rf "$LINK_DIR"
echo "Pronto."
