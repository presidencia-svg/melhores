-- ==========================================================================
-- 027-mover-companhia-formula-para-manipulacao.sql
--
-- Move votos do "Companhia da Fórmula" da sub Farmácia (cadastro errado)
-- pro "Companhia da Formula" da sub Farmácia de Manipulação (sub correta).
--
-- Regra: so move quem AINDA NAO votou em ninguem em Farmacia de Manipulacao
-- (constraint unique(votante,sub) impediria conflitos). Sao 31 votantes
-- nessa situacao. Os 10 restantes (que ja votaram em Farm. Manip.) ficam
-- orfaos no candidato origem, que e' marcado como rejeitado.
--
-- Esperado:
--   Destino: 203 + 31 = 234 votos em Farm. Manipulacao
--   Origem:  marcado rejeitado (10 votos orfaos sem efeito no resultado)
--
-- Roda no SQL Editor do Supabase. NAO e' idempotente — uma so execucao.
-- ==========================================================================

begin;

-- 1) Move os votos pros candidatos elegiveis (que ainda nao votaram em Farm Manip)
update votos
   set candidato_id    = '10c62715-97a1-45a5-8cf5-354743715ff7',
       subcategoria_id = (select id from subcategorias where nome ilike 'farmácia%manip%' limit 1)
 where candidato_id = '996be5d2-1da7-4370-b19b-2d1796d1daa5'
   and votante_id not in (
     select v.votante_id
       from votos v
       join subcategorias s on s.id = v.subcategoria_id
      where s.nome ilike 'farmácia%manip%'
   );

-- 2) Marca o candidato origem como rejeitado
update candidatos
   set status = 'rejeitado'
 where id = '996be5d2-1da7-4370-b19b-2d1796d1daa5';

commit;

-- Verificacao: deve mostrar Companhia da Fórmula (Farm Manip) com 234 votos
select c.nome, s.nome as sub, c.status, count(v.id) as votos
  from candidatos c
  join subcategorias s on s.id = c.subcategoria_id
  left join votos v on v.candidato_id = c.id
 where c.id in (
   '10c62715-97a1-45a5-8cf5-354743715ff7',  -- destino
   '996be5d2-1da7-4370-b19b-2d1796d1daa5'   -- origem (rejeitado)
 )
 group by c.nome, s.nome, c.status
 order by votos desc;
