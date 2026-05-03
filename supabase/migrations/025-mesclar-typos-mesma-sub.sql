-- ==========================================================================
-- 025-mesclar-typos-mesma-sub.sql
--
-- Mescla candidatos duplicados por typo dentro da mesma subcategoria.
-- Como a constraint unique(votante_id, subcategoria_id) ja' impede um
-- votante de votar em 2 candidatos da mesma sub, nao ha' conflito ao mover
-- votos — UPDATE direto resolve.
--
-- Pares aprovados pela CDL apos auditoria pos-eleicao:
--   1. Cactus  <- Cactos          (Hamburgueria)             587 + 18 = 605
--   2. Douglas Airon <- Douglas Aurio (Personal Trainer)     384 + 3 = 387
--   3. Mr. Zoo <- Mrzoo            (Clinica Veterinaria)     255 + 9 = 264
--
-- Roda no SQL Editor do Supabase. Idempotente (status='rejeitado' e' final).
-- ==========================================================================

begin;

-- 1) Cactos -> Cactus
update votos
   set candidato_id = '84b492d0-26ea-4456-955a-185e147a48e7'
 where candidato_id = 'db024a52-3a39-41a6-98ec-ec68b6cf0174';

update candidatos
   set status = 'rejeitado'
 where id = 'db024a52-3a39-41a6-98ec-ec68b6cf0174';

-- 2) Douglas Aurio -> Douglas Airon
update votos
   set candidato_id = '2a8b08e2-0089-4600-a541-34851399f7be'
 where candidato_id = 'e05a071c-c1b2-43c9-885b-1a067f496d28';

update candidatos
   set status = 'rejeitado'
 where id = 'e05a071c-c1b2-43c9-885b-1a067f496d28';

-- 3) Mrzoo -> Mr. Zoo
update votos
   set candidato_id = 'ec94c8e0-6971-42ee-9526-a4ed9065d5ad'
 where candidato_id = '25168a88-d7df-4a3a-8416-d85d019fb12a';

update candidatos
   set status = 'rejeitado'
 where id = '25168a88-d7df-4a3a-8416-d85d019fb12a';

commit;

-- Verificacao pos-merge: deve mostrar os 3 vencedores com os votos somados
select c.nome, s.nome as subcategoria, count(v.id) as votos
  from candidatos c
  join subcategorias s on s.id = c.subcategoria_id
  left join votos v on v.candidato_id = c.id
 where c.id in (
   '84b492d0-26ea-4456-955a-185e147a48e7',  -- Cactus
   '2a8b08e2-0089-4600-a541-34851399f7be',  -- Douglas Airon
   'ec94c8e0-6971-42ee-9526-a4ed9065d5ad'   -- Mr. Zoo
 )
 group by c.nome, s.nome
 order by votos desc;
