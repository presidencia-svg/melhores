-- Adiciona categorias Saúde e Automotivo
-- Roda no SQL Editor do Supabase.

do $$
declare
  v_edicao uuid;
  v_cat_saude uuid;
  v_cat_auto uuid;
begin
  select id into v_edicao from edicao where ano = 2026;
  if v_edicao is null then
    raise exception 'Edição 2026 não encontrada.';
  end if;

  -- Saúde
  insert into categorias (edicao_id, nome, slug, ordem) values
    (v_edicao, 'Saúde', 'saude', 9)
  on conflict (edicao_id, slug) do nothing;

  select id into v_cat_saude from categorias where edicao_id = v_edicao and slug = 'saude';

  insert into subcategorias (categoria_id, nome, slug, ordem) values
    (v_cat_saude, 'Hospital',            'hospital',           1),
    (v_cat_saude, 'Clínica Veterinária', 'clinica-veterinaria', 2),
    (v_cat_saude, 'Plano de Saúde',      'plano-saude',        3),
    (v_cat_saude, 'Laboratório',         'laboratorio',        4)
  on conflict (categoria_id, slug) do nothing;

  -- Automotivo
  insert into categorias (edicao_id, nome, slug, ordem) values
    (v_edicao, 'Automotivo', 'automotivo', 10)
  on conflict (edicao_id, slug) do nothing;

  select id into v_cat_auto from categorias where edicao_id = v_edicao and slug = 'automotivo';

  insert into subcategorias (categoria_id, nome, slug, ordem) values
    (v_cat_auto, 'Concessionária', 'concessionaria', 1),
    (v_cat_auto, 'Auto Peças',     'auto-pecas',     2),
    (v_cat_auto, 'Borracharia',    'borracharia',    3)
  on conflict (categoria_id, slug) do nothing;

  raise notice 'OK. Total cat: %, sub: %.',
    (select count(*) from categorias where edicao_id = v_edicao),
    (select count(*) from subcategorias s join categorias c on c.id = s.categoria_id where c.edicao_id = v_edicao);
end $$;
