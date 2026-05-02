-- ==========================================================================
-- 020-padronizar-nomes-candidatos.sql (v2 — refinada)
--
-- Padroniza nome dos candidatos pra Title Case com regras de PT.
-- Preserva acronimos (ABG, CDL, AMG) e camelCase (iCred, 4Live).
-- Casos ambiguos (underscore, pipe, mistura complexa de digitos+letras)
-- sao FLAGADOS no descricao pra revisao manual e nao tem o nome alterado.
--
-- Stop-words PT minusculas no meio do nome:
--   de, da, do, das, dos, e, na, no, nas, nos, em, a, o, as, os,
--   à, às, com, por, pela, pelo
-- ==========================================================================

create or replace function to_title_case_pt(input text)
returns text
language plpgsql
immutable
as $$
declare
  parts text[];
  word text;
  word_lower text;
  result text := '';
  i int;
  is_first boolean := true;
  stop_words text[] := array[
    'de','da','do','das','dos','e',
    'na','no','nas','nos','em',
    'a','o','as','os','à','às',
    'com','por','pela','pelo'
  ];
begin
  if input is null then return null; end if;
  parts := regexp_split_to_array(
    trim(regexp_replace(input, '\s+', ' ', 'g')),
    ' '
  );
  if parts is null or array_length(parts, 1) is null then return ''; end if;

  for i in 1..array_length(parts, 1) loop
    word := parts[i];
    word_lower := lower(word);

    -- Acronym puro (2-4 chars, todos maiusculos/numeros): preserva
    if word ~ '^[A-Z0-9]{2,4}$' then
      -- ok
    -- CamelCase (lowercase letra seguida de uppercase): preserva
    elsif word ~ '[a-z][A-Z]' then
      -- ok
    -- Stop-word PT no meio do nome: minuscula
    elsif not is_first and word_lower = any(stop_words) then
      word := word_lower;
    -- Caso geral: Title Case da palavra
    else
      word := initcap(word_lower);
    end if;

    if is_first then
      result := word;
      is_first := false;
    else
      result := result || ' ' || word;
    end if;
  end loop;

  return result;
end;
$$;

-- Heuristica pra detectar nomes com formatacao "ambigua" — nao mexer no
-- nome, mas marcar pra admin revisar.
create or replace function nome_precisa_revisao(input text)
returns boolean
language sql
immutable
as $$
  select
    -- underscore (ex: "3L_Grupo", "AcademiaRGperformance")
    input ~ '_'
    -- pipe (ex: "Debora Caroline|carolinemorais_")
    or input ~ '\|'
    -- digito grudado em letra que nao seja simples (ex: "AcademiaRGperformance",
    -- "iCred" eh ok pq tem [a-z][A-Z], mas isso aqui pega outros casos
    or input ~ '[a-z][A-Z][a-z]+[A-Z]'
$$;

-- Aplica em todos os candidatos nao rejeitados:
-- 1) Casos "ambiguos": nome NAO muda, descricao ganha "[obs: sugerido — revisar nome]"
-- 2) Casos OK: nome vai pra Title Case PT + nome_normalizado atualizado
update candidatos
set
  descricao = case
    when nome_precisa_revisao(nome) then
      coalesce(nullif(descricao, '') || ' ', '') || '[obs: sugerido — revisar nome]'
    else descricao
  end,
  nome = case
    when nome_precisa_revisao(nome) then nome
    else to_title_case_pt(nome)
  end,
  nome_normalizado = case
    when nome_precisa_revisao(nome) then nome_normalizado
    else trim(regexp_replace(
      lower(translate(
        to_title_case_pt(nome),
        'ÀÁÂÃÄÅàáâãäåÒÓÔÕÖØòóôõöøÈÉÊËèéêëÇçÌÍÎÏìíîïÙÚÛÜùúûüÿÑñ',
        'AAAAAAaaaaaaOOOOOOooooooEEEEeeeeCcIIIIiiiiUUUUuuuuyNn'
      )),
      '\s+', ' ', 'g'
    ))
  end
where status != 'rejeitado'
  and (
    nome != to_title_case_pt(nome)
    or nome_precisa_revisao(nome)
  );

-- Pra ver os flagados pra revisao manual depois:
-- select id, nome, descricao
-- from candidatos
-- where descricao like '%[obs: sugerido — revisar nome]%'
-- order by nome;
