-- ==========================================================================
-- 018-divulgacao-resultado.sql
--
-- Adiciona coluna pra data/hora da divulgacao do resultado da edicao.
-- Mostrada na pagina /votar/obrigado pra dar previsibilidade pro votante
-- ("seu voto vai ser contabilizado, resultado sai dia X").
-- ==========================================================================

alter table edicao
  add column if not exists divulgacao_resultado timestamptz;
