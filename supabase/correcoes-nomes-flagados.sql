-- Aplica as correcoes manuais nos 12 nomes que a migration 020 flagou pra
-- revisao (descricao com "[obs: sugerido — revisar nome]"). Atualiza nome,
-- nome_normalizado e remove a obs da descricao.
-- Roda no SQL Editor do Supabase.

update candidatos as c
set
  nome = v.novo_nome,
  nome_normalizado = trim(regexp_replace(
    lower(translate(
      v.novo_nome,
      'ÀÁÂÃÄÅàáâãäåÒÓÔÕÖØòóôõöøÈÉÊËèéêëÇçÌÍÎÏìíîïÙÚÛÜùúûüÿÑñ',
      'AAAAAAaaaaaaOOOOOOooooooEEEEeeeeCcIIIIiiiiUUUUuuuuyNn'
    )),
    '\s+', ' ', 'g'
  )),
  descricao = nullif(
    trim(replace(coalesce(c.descricao, ''), '[obs: sugerido — revisar nome]', '')),
    ''
  )
from (values
  ('83f55291-d4bc-43fa-9062-6d6b0c2601b1'::uuid, '3L Grupo'),
  ('4f19d7a5-cb92-48ed-9d3a-ab8a895bf1a1'::uuid, 'Akma Personal'),
  ('8eab1fd7-090e-4177-aa3f-bb082a08b6c5'::uuid, 'Davyd CH'),
  ('00da29b3-24ec-4e52-bd21-a6db9ce389ca'::uuid, 'Debora Caroline'),
  ('df1a40b4-97c8-4812-8e12-fcf1459f56f5'::uuid, 'DM Construções BR'),
  ('334a2b4b-70f3-4195-9003-bb742a9325ff'::uuid, 'Gastroburg'),
  ('0b840951-94bc-424a-964b-623691e889a4'::uuid, 'Lali Santos'),
  ('ec218135-b681-4f20-8681-9374fc8bf1b9'::uuid, 'Millena Souza Arquitetura e Interiores'),
  ('c24c640f-c3f1-4910-868c-61666d393de6'::uuid, 'Pediatra Tais Murta'),
  ('d193d47a-c844-40a9-828a-b3432285b17a'::uuid, 'T Barber Shop'),
  ('c8a606f7-41d7-48b5-a5c3-c49370fd64ab'::uuid, 'Tur Viagens'),
  ('ed69790e-f60e-41a0-9d16-0a57fb2d3889'::uuid, 'Vibe iPhones')
) as v(id, novo_nome)
where c.id = v.id;

-- Confirmacao: lista os 12 com o nome novo e descricao limpa
select id, nome, descricao
from candidatos
where id in (
  '83f55291-d4bc-43fa-9062-6d6b0c2601b1',
  '4f19d7a5-cb92-48ed-9d3a-ab8a895bf1a1',
  '8eab1fd7-090e-4177-aa3f-bb082a08b6c5',
  '00da29b3-24ec-4e52-bd21-a6db9ce389ca',
  'df1a40b4-97c8-4812-8e12-fcf1459f56f5',
  '334a2b4b-70f3-4195-9003-bb742a9325ff',
  '0b840951-94bc-424a-964b-623691e889a4',
  'ec218135-b681-4f20-8681-9374fc8bf1b9',
  'c24c640f-c3f1-4910-868c-61666d393de6',
  'd193d47a-c844-40a9-828a-b3432285b17a',
  'c8a606f7-41d7-48b5-a5c3-c49370fd64ab',
  'ed69790e-f60e-41a0-9d16-0a57fb2d3889'
)
order by nome;
