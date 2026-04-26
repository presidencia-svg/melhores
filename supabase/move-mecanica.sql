-- Move "Mecânica" de Serviços para Automotivo
-- Roda no SQL Editor do Supabase.

update subcategorias
set
  categoria_id = (
    select id from categorias
    where slug = 'automotivo'
      and edicao_id = (select id from edicao where ano = 2026)
  ),
  ordem = 4
where slug = 'mecanica'
  and categoria_id = (
    select id from categorias
    where slug = 'servicos'
      and edicao_id = (select id from edicao where ano = 2026)
  );

-- Confirmação
select c.nome as categoria, s.nome as subcategoria
from subcategorias s
join categorias c on c.id = s.categoria_id
where s.slug = 'mecanica';
