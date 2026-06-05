-- ==========================================================================
-- 055-idempotencia-recarga.sql
--
-- Bug: webhook MP pode ser disparado 2x pelo proprio MP (retry em caso de
-- erro de rede do nosso lado), ou por atacante que conseguiu burlar HMAC.
-- O codigo do webhook checa pagamento.status === "pago" antes de creditar,
-- MAS isso e' race-prone:
--
--   T1: webhook A le pagamento → status='pendente'
--   T1: webhook B le pagamento → status='pendente'  (concorrente)
--   T2: webhook A faz UPDATE pagamento status='pago'
--   T2: webhook A chama creditarCredito → R$ 100 creditado
--   T3: webhook B faz UPDATE pagamento status='pago' (idempotente)
--   T3: webhook B chama creditarCredito → R$ 100 creditado DE NOVO
--
-- Resultado: dupla creditagem do mesmo pagamento real.
--
-- Fix: unique partial em transacoes_credito quando motivo='recarga'.
-- Segundo INSERT vai falhar com unique_violation e o webhook trata como
-- already_processed. Funciona mesmo se o codigo de aplicacao falhar
-- (defesa em profundidade no DB).
--
-- Indice partial pra nao impactar inserts de voto/marketing (que tem
-- pagamento_id null).
-- ==========================================================================

create unique index if not exists ux_transacoes_recarga_pagamento
  on transacoes_credito (pagamento_id)
  where motivo = 'recarga' and pagamento_id is not null;
