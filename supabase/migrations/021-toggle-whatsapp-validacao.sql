-- ==========================================================================
-- 021-toggle-whatsapp-validacao.sql
--
-- Toggle pro admin desligar a validacao por OTP no WhatsApp quando ha
-- problema de pagamento na Meta/Z-API ou bloqueio do WABA. Quando
-- desligado, /votar/finalizar pula direto pra /votar/obrigado e nenhum
-- OTP e enviado.
--
-- Valores: 'ligada' (default) | 'desligada'
-- ==========================================================================

insert into app_config (chave, valor)
values ('whatsapp_validacao', 'ligada')
on conflict (chave) do nothing;
