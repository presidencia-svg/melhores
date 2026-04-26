-- Adiciona subcategorias novas que estavam faltando
-- Roda no SQL Editor do Supabase ANTES de importar o CSV.

do $$
declare
  v_edicao uuid;
  v_cat_comercio uuid;
begin
  select id into v_edicao from edicao where ano = 2026;
  if v_edicao is null then raise exception 'Edição 2026 não encontrada.'; end if;

  select id into v_cat_comercio from categorias where edicao_id = v_edicao and slug = 'comercio';

  insert into subcategorias (categoria_id, nome, slug, ordem) values
    (v_cat_comercio, 'Atacarejo',          'atacarejo',          50),
    (v_cat_comercio, 'Roupas femininas',   'roupas-femininas',   51),
    (v_cat_comercio, 'Roupas masculinas',  'roupas-masculinas',  52),
    (v_cat_comercio, 'Sapatos femininos',  'sapatos-femininos',  53),
    (v_cat_comercio, 'Sapatos masculinos', 'sapatos-masculinos', 54),
    (v_cat_comercio, 'Livraria',           'livraria',           55)
  on conflict (categoria_id, slug) do nothing;

  raise notice 'OK';
end $$;
