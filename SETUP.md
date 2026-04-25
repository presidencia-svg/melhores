# Melhores do Ano CDL Aracaju 2026 — Setup

Guia rápido pra colocar o sistema no ar.

## 1. Supabase

1. Crie projeto em https://supabase.com (plano Pro recomendado p/ 500k votos).
2. No painel, vá em **SQL Editor** → **New Query**.
3. Cole e rode o conteúdo de `supabase/schema.sql`.
4. Cole e rode o conteúdo de `supabase/seed.sql` (cria edição 2026 + categorias-exemplo).
5. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ mantenha em segredo)
6. Em **Storage → Buckets**, confirme que existe o bucket `selfies` (criado pelo seed).
   - Ele é privado por padrão.

## 2. Z-API

1. Acesse https://app.z-api.io
2. **Instâncias Web** → copie `ID da instância` e `Token`.
3. **Segurança** → copie `Account Security Token` (= `Client-Token`).
4. Conecte um número via QR Code (use chip dedicado da CDL).

## 3. SPC Brasil

Já temos contrato. Use o produto que melhor caiba (recomendado: **325** para começar — tem retorno completo). Para reduzir custo, considerar produtos `632`, `633`, `676` (consulte com o representante SPC qual retorna apenas o nome — o Cache no banco evita reconsulta).

## 4. Variáveis de ambiente

Copie `.env.local.example` → `.env.local` e preencha:

```bash
cp .env.local.example .env.local
```

Pontos críticos:
- `HASH_SALT` — gere uma string aleatória forte (`openssl rand -hex 32`).
- `JWT_SECRET` — outra string aleatória.
- `ADMIN_PASSWORD` — senha forte para o painel.
- `SPC_AMBIENTE=homologacao` para testes; troque para `producao` no go-live.

## 5. Rodar localmente

```bash
npm install
npm run dev
```

Acesse:
- http://localhost:3000 — landing
- http://localhost:3000/votar — fluxo de voto
- http://localhost:3000/admin/login — painel

## 6. Deploy Vercel

```bash
npx vercel
```

Configure as variáveis de ambiente no painel da Vercel (não use as de dev). Aponte o domínio `cdlaju.com` na seção **Domains** da Vercel.

## 7. DNS cdlaju.com

No registro do domínio, adicione:
- Registro `A` apontando para o IP da Vercel (eles fornecem)
- OU registro `CNAME` para `cname.vercel-dns.com`

## 8. Importar candidatos

No painel admin → **Candidatos** → upload CSV no formato:

```csv
categoria,subcategoria,nome,descricao,foto_url
Alimentação,Restaurante,Cariri Cabaña,Restaurante regional no Bairro Atalaia,
Alimentação,Restaurante,Cacique Chá,Cozinha contemporânea,
```

## 9. Checklist pré-lançamento

- [ ] Supabase com schema + seed aplicados
- [ ] Bucket `selfies` criado e privado
- [ ] Z-API conectada e enviando mensagens
- [ ] SPC em modo `producao`
- [ ] Senha admin trocada
- [ ] `HASH_SALT` e `JWT_SECRET` rotacionados
- [ ] Domínio cdlaju.com com SSL ativo
- [ ] Categorias e candidatos importados
- [ ] Teste end-to-end (CPF → selfie → voto → WhatsApp) feito em produção

## 10. Backup e custos

- Supabase: ative backups diários no plano Pro
- SPC: monitore consumo (cada CPF novo = 1 consulta paga)
- Z-API: limite envio em horário comercial pra evitar bloqueio do WhatsApp
