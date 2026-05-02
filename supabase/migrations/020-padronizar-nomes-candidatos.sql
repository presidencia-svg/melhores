-- ==========================================================================
-- 020-padronizar-nomes-candidatos.sql
--
-- Padroniza nome dos candidatos pra Title Case ("Karina Moraes", nao
-- "karina moraes" nem "INÊS MORAIS"). Conjuncoes/preposicoes em PT
-- ficam minusculas no meio do nome (de, da, do, dos, das, e).
--
-- Usa UPDATE pontual + funcao auxiliar imutavel pra reuso.
-- ==========================================================================

create or replace function to_title_case_pt(input text)
returns text
language plpgsql
immutable
as $$
declare
  s text;
begin
  if input is null then return null; end if;
  s := trim(regexp_replace(input, '\s+', ' ', 'g'));
  if s = '' then return ''; end if;

  -- Title case basico (initcap respeita unicode em Postgres moderno)
  s := initcap(lower(s));

  -- Coloca preposicoes/conjuncoes minusculas no meio do nome.
  -- O \S evita afetar a 1a palavra (que tem que comecar com maiuscula).
  s := regexp_replace(s, '(\S) De ',  '\1 de ',  'g');
  s := regexp_replace(s, '(\S) Da ',  '\1 da ',  'g');
  s := regexp_replace(s, '(\S) Do ',  '\1 do ',  'g');
  s := regexp_replace(s, '(\S) Das ', '\1 das ', 'g');
  s := regexp_replace(s, '(\S) Dos ', '\1 dos ', 'g');
  s := regexp_replace(s, '(\S) E ',   '\1 e ',   'g');

  return s;
end;
$$;

-- Aplica em todos os candidatos nao rejeitados que ainda nao estao no
-- formato. Atualiza nome_normalizado tambem (lower + sem acento + trim
-- de espacos) — replicando a logica do normalizarNome do app.
update candidatos
set
  nome = to_title_case_pt(nome),
  nome_normalizado = trim(regexp_replace(
    lower(translate(
      to_title_case_pt(nome),
      'ÀÁÂÃÄÅàáâãäåÒÓÔÕÖØòóôõöøÈÉÊËèéêëÇçÌÍÎÏìíîïÙÚÛÜùúûüÿÑñ',
      'AAAAAAaaaaaaOOOOOOooooooEEEEeeeeCcIIIIiiiiUUUUuuuuyNn'
    )),
    '\s+', ' ', 'g'
  ))
where status != 'rejeitado'
  and nome != to_title_case_pt(nome);

-- Pre-visualizacao do que mudou (rode separado se quiser conferir antes):
-- select nome from candidatos where status != 'rejeitado'
--   and nome != to_title_case_pt(nome);
