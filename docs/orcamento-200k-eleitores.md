# Orçamento · Melhores do Ano — 200 mil eleitores / 500 mil votos

Levantamento de custo para uma campanha no **mesmo formato** da edição
CDL Aracaju 2025 (CPF + selfie + validação SPC + OTP WhatsApp + disparos de
parcial/incentivo/cerimônia), escalada para **200.000 eleitores** e
**~500.000 votos**.

Data: setembro/2026. Preços por unidade vêm de `lib/creditos/precos.ts`
(fonte única da tabela cobrada em `/admin/creditos`).

---

## 1. Base real: edição CDL Aracaju 2025

Números lidos direto do banco (projeto Supabase "Melhores do ano",
edição `602eea78…`, votação 25/04 a 03/05/2026):

| Métrica | Valor | Por eleitor |
|---|---:|---:|
| Eleitores cadastrados | 48.775 | — |
| Votos registrados | 216.707 | 4,44 |
| Eleitores que votaram em ≥ 1 subcategoria | 45.601 (93,5%) | — |
| Validados no SPC | 44.544 (91,3%) | — |
| Com selfie | 48.741 (99,9%) | — |
| WhatsApp validado (OTP concluído) | 10.511 (21,5%) | — |
| OTPs enviados (`whatsapp_codigos`) | 27.229 | 0,56 |
| Parcial enviada | 10.383 | 0,21 |
| Incentivo (empate) enviado | 9.438 | 0,19 |
| Aviso de cerimônia enviado | 500 | 0,01 |
| **Total mensagens de marketing** | **20.321** | **0,42** |
| Subcategorias ativas | 103 | — |
| Candidatos aprovados | 9.282 | — |

Os índices "por eleitor" são os multiplicadores usados na projeção abaixo.

---

## 2. Projeção para 200.000 eleitores

Fator de escala: **4,1x** em eleitores. O cliente estima ~500 mil votos
(2,5 votos/eleitor); em Aracaju a média foi 4,44, então 200 mil eleitores
tendem a gerar **~890 mil votos**. Como a cobrança é **por eleitor**, e não
por voto, o total abaixo não muda se os votos ficarem entre 500 mil e
900 mil — só a infraestrutura (seção 4) é afetada.

### 2.1 Volumes projetados

| Item | Índice (Aracaju) | Volume projetado |
|---|---:|---:|
| Eleitores cadastrados | 1,00 | 200.000 |
| OTPs WhatsApp enviados | 0,56 | 112.000 |
| Mensagens de parcial | 0,21 | 42.600 |
| Mensagens de incentivo | 0,19 | 38.700 |
| Mensagens de cerimônia | 0,01 | 2.100 |
| **Total marketing** | **0,42** | **83.400** |

### 2.2 Orçamento acordado (proposta ao cliente) — 100 mil eleitores

Preços negociados para esta proposta (diferentes da tabela padrão de
`lib/creditos/precos.ts`, ver anexo 2.4):

| Item | Qtd | Unitário | Subtotal |
|---|---:|---:|---:|
| Cadastro com validação SPC Brasil (CPF + selfie + consulta SPC) | 100.000 | R$ 0,13 | **R$ 13.000,00** |
| Cadastro com validação WhatsApp (OTP) | 100.000 | R$ 0,18 | **R$ 18.000,00** |
| **Total da campanha** | | | **R$ 31.000,00** |

**Opcional de marketing (fora do total):**

| Item | Qtd | Unitário | Subtotal |
|---|---:|---:|---:|
| Disparo de parcial por WhatsApp (posicionamento dos candidatos) | 20.000 | R$ 0,45 | **R$ 9.000,00** |
| **Total com o opcional** | | | **R$ 40.000,00** |

Outros opcionais: taxa de campanha R$ 3.000 (1x), disparos de
incentivo/cerimônia R$ 0,45 por envio, manutenção R$ 200/mês.

São **100 mil pessoas**: cada cadastro passa pelas duas validações,
**R$ 0,31 por eleitor**.

### 2.3 Cenários de recarga

Recarga inicial sugerida de R$ 16 mil na abertura e R$ 15 mil na metade da
votação. Os débitos ocorrem por eleitor validado, então o cliente paga só
pelo que for efetivamente realizado.

### 2.4 Anexo: referência pela tabela padrão da plataforma

Para comparação, o mesmo formato a preço de tabela (R$ 0,25 eleitor com SPC,
R$ 0,25 OTP, R$ 0,59 marketing) em 200 mil eleitores ficaria em
R$ 130.206 (R$ 50.000 + R$ 28.000 + R$ 49.206 + R$ 3.000 de taxa).

## 3. Como o valor é cobrado

- Cobrança **por eleitor, uma vez no cadastro** (não por voto).
- OTP e marketing debitam do saldo de créditos a cada envio
  (`whatsapp_confirmacao` e `marketing` em `transacoes_credito`).
- O cliente recarrega créditos em `/admin/creditos/comprar` (Pix ou cartão,
  Mercado Pago). Alerta automático de saldo baixo (`/api/cron/alertas-saldo`).
- Sugestão de recarga inicial: **R$ 60 mil** (cobre cadastro + OTP), e
  segunda recarga de **R$ 50 mil** antes dos disparos de parcial.

---

## 4. Custo interno estimado (uso interno, não enviar ao cliente)

Estimativas para checar margem. Confirmar tarifas vigentes com cada
fornecedor antes de fechar.

| Fornecedor | Base | Estimativa |
|---|---|---:|
| Meta WhatsApp — autenticação (OTP) | 100.000 × ~US$ 0,0315 (BR) ≈ R$ 0,17 | ~R$ 17.000 |
| Meta WhatsApp — marketing (opcional de parcial) | 20.000 × ~US$ 0,0625 (BR) ≈ R$ 0,34 | ~R$ 6.800 |
| SPC Brasil — consulta por CPF novo (se ligado) | 100.000 × tarifa contratual (assumido R$ 0,10) | ~R$ 10.000 |
| Supabase Pro + compute (2 meses) | plano Pro + upgrade de compute no pico | ~R$ 1.500 |
| Storage de selfies | 200.000 × ~150 KB ≈ 30 GB | incluso/≈ R$ 100 |
| Vercel Pro (2 meses) | plano + banda | ~R$ 500 |
| Cloudflare Turnstile / DNS | — | R$ 0 |
| **Total interno estimado** | | **~R$ 35.900** (com o opcional) |

Margem bruta estimada no orçamento acordado (R$ 31.000): **~R$ 1.900 (≈ 6%)**
com SPC ligado a R$ 0,10; **~R$ 11.900 (≈ 38%)** se a validação da
aplicação for só CPF + selfie, sem consulta SPC. A R$ 0,13 por eleitor,
qualquer tarifa SPC acima de R$ 0,12 torna a linha de validação deficitária.
O OTP a R$ 0,18 cobre a tarifa Meta (~R$ 0,17) com margem mínima; a cotação
do dólar é o risco. O opcional de parcial a R$ 0,45 tem custo Meta de
~R$ 0,34 por envio: margem de ~R$ 2.200 (≈ 24%) nos 20 mil disparos. O cache (`spc_cache`, 61.455 CPFs)
evita reconsulta de quem já votou em outra edição.

---

## 5. Observações operacionais para 200 mil eleitores

- **Pico**: Aracaju teve 48 mil cadastros em 8 dias. Para 200 mil, prever
  janela de votação de 3 a 4 semanas ou reforçar compute do Supabase e
  os phone_number_ids da Meta (round-robin já suportado em
  `lib/meta-whatsapp/client.ts`).
- **Números WhatsApp**: 112 mil OTPs + 83 mil disparos exigem 3 a 4
  números verificados na Meta para não estourar o tier de mensagens.
- **Rate limit por IP** (`rate_limit_ip` teve 369 mil linhas): rodar
  `/api/cron/manutencao-mensal` semanalmente durante a campanha.
- **Bucket `selfies`**: limites atuais (migração 058) comportam o volume;
  monitorar quota de storage do plano.
