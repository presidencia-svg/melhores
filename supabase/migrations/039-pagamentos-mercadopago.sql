-- ==========================================================================
-- 039-pagamentos-mercadopago.sql
--
-- Renomeia colunas ps_* → mp_* na tabela pagamentos. Usuario optou por
-- Mercado Pago (mesmo provedor do CupomPro) ao inves de PagSeguro.
--
-- Aditivo no sentido de schema: dados de pagamentos (se houver) sao
-- preservados via ALTER TABLE RENAME COLUMN.
-- ==========================================================================

alter table pagamentos rename column ps_charge_id to mp_payment_id;
alter table pagamentos rename column ps_session_id to mp_preference_id;
alter table pagamentos rename column ps_qr_code to mp_qr_code;
alter table pagamentos rename column ps_qr_code_url to mp_qr_code_base64;
alter table pagamentos rename column ps_payment_url to mp_init_point;
alter table pagamentos rename column ps_payload to mp_payload;

-- Recria indice com nome novo
drop index if exists idx_pagamentos_ps_charge;
create index if not exists idx_pagamentos_mp_payment
  on pagamentos(mp_payment_id) where mp_payment_id is not null;
