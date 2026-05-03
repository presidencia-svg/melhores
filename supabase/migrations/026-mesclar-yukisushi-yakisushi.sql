-- ==========================================================================
-- 026-mesclar-yukisushi-yakisushi.sql
--
-- Mesclagem aprovada pela CDL: Yukisushi e Yakisushi sao o mesmo restaurante
-- (typo de 1 letra). Yakisushi (143) leva os votos do Yukisushi (112).
-- Total final: 255 votos em Sushi.
--
-- Roda no SQL Editor do Supabase. Idempotente.
-- ==========================================================================

begin;

update votos
   set candidato_id = '9cb498b2-9eef-4a43-a268-c3fdeb974433'  -- Yakisushi
 where candidato_id = 'fe18a7e1-5f1a-43f1-a2cd-a4bfa90525dd'; -- Yukisushi

update candidatos
   set status = 'rejeitado'
 where id = 'fe18a7e1-5f1a-43f1-a2cd-a4bfa90525dd';

commit;

-- Verificacao: deve mostrar Yakisushi 255 (143 + 112)
select c.nome, s.nome as sub, count(v.id) as votos
  from candidatos c
  join subcategorias s on s.id = c.subcategoria_id
  left join votos v on v.candidato_id = c.id
 where c.id = '9cb498b2-9eef-4a43-a268-c3fdeb974433'
 group by c.nome, s.nome;
