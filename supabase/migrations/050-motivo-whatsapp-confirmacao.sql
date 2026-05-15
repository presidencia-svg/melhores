-- ==========================================================================
-- 050-motivo-whatsapp-confirmacao.sql
--
-- Refatora o modelo de cobranca: agora a confirmacao por WhatsApp (OTP)
-- e' debitada SEPARADO do cadastro do votante.
--
-- Antes:
--   - Cadastro CPF + selfie + SPC + WhatsApp = R$ 0,60 (motivo='voto_spc_whatsapp')
--   - Tudo num debito so na hora do cadastro
--
-- Agora:
--   - Cadastro com SPC = R$ 0,25 (motivo='voto_spc')
--   - Cadastro sem SPC = R$ 0,20 (motivo='voto_minimo')
--   - Cada envio de OTP WhatsApp = R$ 0,25 (motivo='whatsapp_confirmacao' — NOVO)
--   - Cada disparo de marketing/incentivo = R$ 0,80 (motivo='marketing')
--
-- Adiciona 'whatsapp_confirmacao' no check constraint. Mantem
-- 'voto_spc_whatsapp' na lista pra preservar historico de transacoes
-- antigas (constraint nao apaga linhas, so valida novas insercoes).
-- ==========================================================================

alter table transacoes_credito drop constraint if exists transacoes_credito_motivo_check;
alter table transacoes_credito add constraint transacoes_credito_motivo_check
  check (motivo in (
    'recarga',
    'voto_minimo',
    'voto_spc',
    'voto_spc_whatsapp',     -- legacy, mantido pra historico
    'whatsapp_confirmacao',  -- NOVO: OTP enviado, R$ 0,25 por disparo
    'marketing',
    'taxa_campanha',
    'manutencao',
    'cortesia',
    'estorno',
    'reembolso',
    'cupom'
  ));
