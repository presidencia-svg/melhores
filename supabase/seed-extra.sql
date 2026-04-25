-- ==========================================================================
-- SEED EXTRA — adiciona +46 subcategorias e 2 categorias novas
-- Rode no SQL Editor do Supabase APÓS o seed.sql
-- Idempotente: pula linhas que já existem (constraint unique slug)
-- ==========================================================================

do $$
declare
  v_edicao uuid;
  v_cat_comercio uuid;
  v_cat_servicos uuid;
  v_cat_profissional uuid;
  v_cat_lazer uuid;
  v_cat_educacao uuid;
  v_cat_empresas uuid;
begin
  select id into v_edicao from edicao where ano = 2026;
  if v_edicao is null then
    raise exception 'Edição 2026 não encontrada. Rode seed.sql primeiro.';
  end if;

  select id into v_cat_comercio    from categorias where edicao_id = v_edicao and slug = 'comercio';
  select id into v_cat_servicos    from categorias where edicao_id = v_edicao and slug = 'servicos';
  select id into v_cat_profissional from categorias where edicao_id = v_edicao and slug = 'profissionais-liberais';
  select id into v_cat_lazer       from categorias where edicao_id = v_edicao and slug = 'lazer';

  -- ---------- Comércio (+20) ----------
  insert into subcategorias (categoria_id, nome, slug, ordem) values
    (v_cat_comercio, 'Móveis',                   'moveis',                  10),
    (v_cat_comercio, 'Decoração',                'decoracao',               11),
    (v_cat_comercio, 'Utilidades domésticas',    'utilidades-domesticas',   12),
    (v_cat_comercio, 'Cama, mesa e banho',       'cama-mesa-banho',         13),
    (v_cat_comercio, 'Materiais de construção',  'materiais-construcao',    14),
    (v_cat_comercio, 'Celulares e acessórios',   'celulares-acessorios',    15),
    (v_cat_comercio, 'Informática',              'informatica',             16),
    (v_cat_comercio, 'Eletrodomésticos',         'eletrodomesticos',        17),
    (v_cat_comercio, 'Perfumarias',              'perfumarias',             18),
    (v_cat_comercio, 'Cosméticos',               'cosmeticos',              19),
    (v_cat_comercio, 'Moda íntima e praia',      'moda-intima-praia',       20),
    (v_cat_comercio, 'Tecidos',                  'tecidos',                 21),
    (v_cat_comercio, 'Armarinhos',               'armarinhos',              22),
    (v_cat_comercio, 'Ferramentas e Ferragens',  'ferramentas-ferragens',   23),
    (v_cat_comercio, 'Rações',                   'racoes',                  24),
    (v_cat_comercio, 'Produtos rurais',          'produtos-rurais',         25),
    (v_cat_comercio, 'Equipamentos agrícolas',   'equipamentos-agricolas',  26),
    (v_cat_comercio, 'Artesanato local',         'artesanato-local',        27),
    (v_cat_comercio, 'Souvenirs',                'souvenirs',               28),
    (v_cat_comercio, 'Produtos típicos',         'produtos-tipicos',        29)
  on conflict (categoria_id, slug) do nothing;

  -- ---------- Serviços (+11) ----------
  insert into subcategorias (categoria_id, nome, slug, ordem) values
    (v_cat_servicos, 'Assistência técnica',         'assistencia-tecnica',      10),
    (v_cat_servicos, 'Clínicas estéticas',          'clinicas-esteticas',       11),
    (v_cat_servicos, 'Lavanderias',                 'lavanderias',              12),
    (v_cat_servicos, 'Ajustes e consertos',         'ajustes-consertos',        13),
    (v_cat_servicos, 'Jardinagem e Paisagismo',     'jardinagem-paisagismo',    14),
    (v_cat_servicos, 'Segurança e Monitoramento',   'seguranca-monitoramento',  15),
    (v_cat_servicos, 'Design e Comunicação Visual', 'design-comunicacao',       16),
    (v_cat_servicos, 'Contabilidade e Consultoria', 'contabilidade-consultoria',17),
    (v_cat_servicos, 'Escritórios e Coworking',     'escritorios-coworking',    18),
    (v_cat_servicos, 'Locação de equipamentos',     'locacao-equipamentos',     19),
    (v_cat_servicos, 'Organização de eventos',      'organizacao-eventos',      20)
  on conflict (categoria_id, slug) do nothing;

  -- ---------- Profissionais Liberais (+2) ----------
  insert into subcategorias (categoria_id, nome, slug, ordem) values
    (v_cat_profissional, 'Massoterapia',          'massoterapia',          10),
    (v_cat_profissional, 'Terapias alternativas', 'terapias-alternativas', 11)
  on conflict (categoria_id, slug) do nothing;

  -- ---------- Lazer e Entretenimento (+4) ----------
  insert into subcategorias (categoria_id, nome, slug, ordem) values
    (v_cat_lazer, 'Hotéis',                'hoteis',               10),
    (v_cat_lazer, 'Pousadas',              'pousadas',             11),
    (v_cat_lazer, 'Receptivos turísticos', 'receptivos-turisticos',12),
    (v_cat_lazer, 'Buffets',               'buffets',              13)
  on conflict (categoria_id, slug) do nothing;

  -- ---------- Categoria NOVA: Educação ----------
  insert into categorias (edicao_id, nome, slug, ordem) values
    (v_edicao, 'Educação', 'educacao', 6)
  on conflict (edicao_id, slug) do nothing;

  select id into v_cat_educacao from categorias where edicao_id = v_edicao and slug = 'educacao';

  insert into subcategorias (categoria_id, nome, slug, ordem) values
    (v_cat_educacao, 'Escolas',       'escolas',       1),
    (v_cat_educacao, 'Cursos livres', 'cursos-livres', 2),
    (v_cat_educacao, 'Idiomas',       'idiomas',       3)
  on conflict (categoria_id, slug) do nothing;

  -- ---------- Categoria NOVA: Empresas e Negócios ----------
  insert into categorias (edicao_id, nome, slug, ordem) values
    (v_edicao, 'Empresas e Negócios', 'empresas-negocios', 7)
  on conflict (edicao_id, slug) do nothing;

  select id into v_cat_empresas from categorias where edicao_id = v_edicao and slug = 'empresas-negocios';

  insert into subcategorias (categoria_id, nome, slug, ordem) values
    (v_cat_empresas, 'Papelaria corporativa',     'papelaria-corporativa',     1),
    (v_cat_empresas, 'Suprimentos empresariais',  'suprimentos-empresariais',  2),
    (v_cat_empresas, 'Equipamentos industriais',  'equipamentos-industriais',  3),
    (v_cat_empresas, 'Correspondentes bancários', 'correspondentes-bancarios', 4),
    (v_cat_empresas, 'Crédito e financiamento',   'credito-financiamento',     5)
  on conflict (categoria_id, slug) do nothing;

  raise notice 'Seed extra concluído. % categorias e % subcategorias na edição.',
    (select count(*) from categorias where edicao_id = v_edicao),
    (select count(*) from subcategorias s join categorias c on c.id = s.categoria_id where c.edicao_id = v_edicao);

end $$;
