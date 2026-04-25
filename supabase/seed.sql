-- ==========================================================================
-- SEED — Edição 2026 + categorias exemplo (rode após schema.sql)
-- ==========================================================================

-- Edição ativa
insert into edicao (ano, nome, inicio_votacao, fim_votacao, ativa)
values (
  2026,
  'Melhores do Ano CDL Aracaju 2026',
  now(),
  now() + interval '30 days',
  true
)
on conflict (ano) do update set
  nome = excluded.nome,
  inicio_votacao = excluded.inicio_votacao,
  fim_votacao = excluded.fim_votacao,
  ativa = true;

-- Storage bucket para selfies (privado)
insert into storage.buckets (id, name, public)
values ('selfies', 'selfies', false)
on conflict (id) do nothing;

-- Helper: id da edição
do $$
declare
  v_edicao uuid;
  v_cat_alimentacao uuid;
  v_cat_profissional uuid;
  v_cat_servicos uuid;
  v_cat_comercio uuid;
  v_cat_lazer uuid;
begin
  select id into v_edicao from edicao where ano = 2026;

  -- Categorias
  insert into categorias (edicao_id, nome, slug, ordem) values
    (v_edicao, 'Alimentação', 'alimentacao', 1)
    returning id into v_cat_alimentacao;

  insert into categorias (edicao_id, nome, slug, ordem) values
    (v_edicao, 'Profissionais Liberais', 'profissionais-liberais', 2)
    returning id into v_cat_profissional;

  insert into categorias (edicao_id, nome, slug, ordem) values
    (v_edicao, 'Serviços', 'servicos', 3)
    returning id into v_cat_servicos;

  insert into categorias (edicao_id, nome, slug, ordem) values
    (v_edicao, 'Comércio', 'comercio', 4)
    returning id into v_cat_comercio;

  insert into categorias (edicao_id, nome, slug, ordem) values
    (v_edicao, 'Lazer e Entretenimento', 'lazer', 5)
    returning id into v_cat_lazer;

  -- Subcategorias — Alimentação
  insert into subcategorias (categoria_id, nome, slug, ordem) values
    (v_cat_alimentacao, 'Restaurante', 'restaurante', 1),
    (v_cat_alimentacao, 'Bar', 'bar', 2),
    (v_cat_alimentacao, 'Pizzaria', 'pizzaria', 3),
    (v_cat_alimentacao, 'Hamburgueria', 'hamburgueria', 4),
    (v_cat_alimentacao, 'Sushi', 'sushi', 5),
    (v_cat_alimentacao, 'Acarajé', 'acaraje', 6),
    (v_cat_alimentacao, 'Padaria', 'padaria', 7),
    (v_cat_alimentacao, 'Sorveteria', 'sorveteria', 8),
    (v_cat_alimentacao, 'Cafeteria', 'cafeteria', 9);

  -- Subcategorias — Profissionais
  insert into subcategorias (categoria_id, nome, slug, ordem) values
    (v_cat_profissional, 'Advogado', 'advogado', 1),
    (v_cat_profissional, 'Médico Clínico Geral', 'medico-clinico', 2),
    (v_cat_profissional, 'Ginecologista', 'ginecologista', 3),
    (v_cat_profissional, 'Pediatra', 'pediatra', 4),
    (v_cat_profissional, 'Dentista', 'dentista', 5),
    (v_cat_profissional, 'Arquiteto', 'arquiteto', 6),
    (v_cat_profissional, 'Contador', 'contador', 7),
    (v_cat_profissional, 'Personal Trainer', 'personal-trainer', 8),
    (v_cat_profissional, 'Nutricionista', 'nutricionista', 9);

  -- Subcategorias — Serviços
  insert into subcategorias (categoria_id, nome, slug, ordem) values
    (v_cat_servicos, 'Salão de Beleza', 'salao-beleza', 1),
    (v_cat_servicos, 'Barbearia', 'barbearia', 2),
    (v_cat_servicos, 'Academia', 'academia', 3),
    (v_cat_servicos, 'Pet Shop', 'pet-shop', 4),
    (v_cat_servicos, 'Lava Jato', 'lava-jato', 5),
    (v_cat_servicos, 'Mecânica', 'mecanica', 6);

  -- Subcategorias — Comércio
  insert into subcategorias (categoria_id, nome, slug, ordem) values
    (v_cat_comercio, 'Loja de Roupas', 'loja-roupas', 1),
    (v_cat_comercio, 'Loja de Calçados', 'loja-calcados', 2),
    (v_cat_comercio, 'Ótica', 'otica', 3),
    (v_cat_comercio, 'Joalheria', 'joalheria', 4),
    (v_cat_comercio, 'Farmácia', 'farmacia', 5),
    (v_cat_comercio, 'Supermercado', 'supermercado', 6);

  -- Subcategorias — Lazer
  insert into subcategorias (categoria_id, nome, slug, ordem) values
    (v_cat_lazer, 'Casa de Show', 'casa-show', 1),
    (v_cat_lazer, 'Hotel/Pousada', 'hotel', 2),
    (v_cat_lazer, 'Praia/Atrativo Turístico', 'turismo', 3),
    (v_cat_lazer, 'Cinema', 'cinema', 4);

end $$;
