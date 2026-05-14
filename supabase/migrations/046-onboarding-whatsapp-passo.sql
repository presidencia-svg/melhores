-- ==========================================================================
-- 046-onboarding-whatsapp-passo.sql
--
-- Antes: o passo "WhatsApp" do wizard pedia Phone Number ID + nomes de
-- templates pra cada tenant. Mas o envio na pratica e' centralizado: todas
-- as mensagens WhatsApp saem do env META_WHATSAPP_PHONE_IDS (numero do
-- super admin). O tenant.meta_phone_number_id nunca e' lido pelos callers
-- de enviarTemplate. Ou seja, o passo coletava dado morto.
--
-- Agora: o passo so pergunta "validar votantes por WhatsApp? sim/nao" e
-- grava na chave app_config.whatsapp_validacao. Pra saber se o tenant ja
-- escolheu (vs ainda pendente), introduzimos a chave onboarding_whatsapp
-- com valores 'pendente' | 'feito'.
--
-- Backfill: tenants que ja existem sao marcados 'feito' (ja estao rodando,
-- nao precisam re-onboarding).
-- ==========================================================================

insert into app_config (tenant_id, chave, valor)
select id, 'onboarding_whatsapp', 'feito' from tenants
on conflict (tenant_id, chave) do nothing;
