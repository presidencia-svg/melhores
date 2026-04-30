-- ==========================================================================
-- 011-limpar-arroba-candidatos.sql
--
-- Candidatos estavam colocando "@" e outros caracteres especiais no inicio
-- do nome pra ficar em primeiro na ordem alfabetica da pagina de votacao.
-- Esta migration:
--   1. Remove "@" de qualquer posicao do nome (e do nome_normalizado).
--   2. Remove caracteres especiais que estejam no INICIO do nome
--      (mantém letras, numeros e acentos no inicio).
--   3. Re-trim e re-collapse de espacos depois das remocoes.
--
-- Antes/depois pra ver o que mudou:
--   select id, nome from candidatos
--   where nome ~ '^[^[:alnum:]ÀÁÂÃÉÊÍÓÔÕÚÇàáâãéêíóôõúç]'
--      or nome like '%@%';
-- ==========================================================================

update candidatos
set
  nome = trim(
    regexp_replace(
      regexp_replace(nome, '@', '', 'g'),                    -- tira todos os @
      '^[^[:alnum:]ÀÁÂÃÉÊÍÓÔÕÚÇàáâãéêíóôõúç]+',               -- e prefixos especiais
      ''
    )
  ),
  nome_normalizado = trim(
    regexp_replace(
      regexp_replace(nome_normalizado, '@', '', 'g'),
      '^[^[:alnum:]ÀÁÂÃÉÊÍÓÔÕÚÇàáâãéêíóôõúç]+',
      ''
    )
  )
where nome like '%@%'
   or nome_normalizado like '%@%'
   or nome ~ '^[^[:alnum:]ÀÁÂÃÉÊÍÓÔÕÚÇàáâãéêíóôõúç]';
