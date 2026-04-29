-- Move o candidato "Companhia da Fórmula" (com seus votos) para a
-- subcategoria nova "Farmácia de manipulação" (em Comércio).
-- Roda no SQL Editor do Supabase.

do $$
declare
  v_edicao        uuid;
  v_cat_comercio  uuid;
  v_sub_nova      uuid;
  v_candidato     uuid;
  v_sub_origem    uuid;
  v_votos_movidos int;
begin
  select id into v_edicao from edicao where ativa = true limit 1;
  if v_edicao is null then
    raise exception 'Nenhuma edição ativa encontrada.';
  end if;

  select id into v_cat_comercio
  from categorias
  where edicao_id = v_edicao and slug = 'comercio';

  -- 1. Acha a subcategoria "Farmácia de manipulação" (já criada via admin)
  select id into v_sub_nova
  from subcategorias
  where categoria_id = v_cat_comercio
    and (nome ilike 'farm%cia de manipula%' or slug ilike 'farmacia%manipula%')
  limit 1;

  if v_sub_nova is null then
    raise exception 'Subcategoria "Farmácia de manipulação" não encontrada em Comércio.';
  end if;

  -- 2. Acha o candidato "Companhia da Fórmula"
  select id, subcategoria_id into v_candidato, v_sub_origem
  from candidatos
  where nome ilike 'companhia da f%rmula%'
    and subcategoria_id in (select id from subcategorias where categoria_id in (
      select id from categorias where edicao_id = v_edicao
    ))
  limit 1;

  if v_candidato is null then
    raise exception 'Candidato "Companhia da Fórmula" não encontrado na edição 2026.';
  end if;

  -- 3. Move o candidato pra subcategoria nova
  update candidatos
  set subcategoria_id = v_sub_nova
  where id = v_candidato;

  -- 4. Atualiza os votos existentes pra refletir a subcategoria nova
  --    (a constraint unique (votante_id, subcategoria_id) não conflita
  --     porque a subcategoria nova acabou de ser criada)
  update votos
  set subcategoria_id = v_sub_nova
  where candidato_id = v_candidato;

  get diagnostics v_votos_movidos = row_count;

  raise notice 'OK — candidato % movido de % para %; % votos atualizados.',
    v_candidato, v_sub_origem, v_sub_nova, v_votos_movidos;
end $$;

-- Confirmação
select
  c.nome as categoria,
  s.nome as subcategoria,
  ca.nome as candidato,
  (select count(*) from votos v where v.candidato_id = ca.id) as votos
from candidatos ca
join subcategorias s on s.id = ca.subcategoria_id
join categorias c on c.id = s.categoria_id
where ca.nome ilike 'companhia da f%rmula%';
