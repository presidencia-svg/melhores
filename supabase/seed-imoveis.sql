-- Adiciona categoria "Imóveis e Construção" com Construtora e Imobiliária
-- Roda no SQL Editor do Supabase.

do $$
declare
  v_edicao uuid;
  v_cat uuid;
begin
  select id into v_edicao from edicao where ano = 2026;
  if v_edicao is null then
    raise exception 'Edição 2026 não encontrada.';
  end if;

  insert into categorias (edicao_id, nome, slug, ordem) values
    (v_edicao, 'Imóveis e Construção', 'imoveis-construcao', 8)
  on conflict (edicao_id, slug) do nothing;

  select id into v_cat from categorias where edicao_id = v_edicao and slug = 'imoveis-construcao';

  insert into subcategorias (categoria_id, nome, slug, ordem) values
    (v_cat, 'Construtora',  'construtora',  1),
    (v_cat, 'Imobiliária',  'imobiliaria',  2)
  on conflict (categoria_id, slug) do nothing;

  raise notice 'OK. Total de categorias: %, subcategorias: %.',
    (select count(*) from categorias where edicao_id = v_edicao),
    (select count(*) from subcategorias s join categorias c on c.id = s.categoria_id where c.edicao_id = v_edicao);
end $$;
