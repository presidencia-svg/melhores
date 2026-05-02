-- Mescla os dois "Brumar" da edicao ativa: o que esta em "Produtos rurais"
-- vira parte do que esta em "Produtos naturais". Os 35 votos do rurais sao
-- transferidos pro naturais (56 votos -> ~91), preservando conflitos: se
-- um votante ja votou em alguem em naturais, o voto antigo no Brumar rurais
-- e descartado.
-- Roda no SQL Editor do Supabase.

do $$
declare
  v_edicao         uuid;
  v_brumar_rurais  uuid;
  v_brumar_naturais uuid;
  v_sub_naturais   uuid;
  v_sub_rurais     uuid;
  v_movidos        int;
  v_descartados    int;
begin
  select id into v_edicao from edicao where ativa = true limit 1;
  if v_edicao is null then
    raise exception 'Nenhuma edição ativa encontrada.';
  end if;

  -- 1. Acha Brumar em Produtos Naturais (DESTINO — fica)
  select c.id, c.subcategoria_id
  into v_brumar_naturais, v_sub_naturais
  from candidatos c
  join subcategorias s on s.id = c.subcategoria_id
  join categorias cat on cat.id = s.categoria_id
  where cat.edicao_id = v_edicao
    and c.nome ilike 'brumar%'
    and s.nome ilike 'produtos%natura%'
  limit 1;

  -- 2. Acha Brumar em Produtos Rurais (ORIGEM — vai morrer)
  select c.id, c.subcategoria_id
  into v_brumar_rurais, v_sub_rurais
  from candidatos c
  join subcategorias s on s.id = c.subcategoria_id
  join categorias cat on cat.id = s.categoria_id
  where cat.edicao_id = v_edicao
    and c.nome ilike 'brumar%'
    and s.nome ilike 'produtos%rura%'
  limit 1;

  if v_brumar_rurais is null then
    raise exception 'Brumar em "Produtos rurais" não encontrado.';
  end if;
  if v_brumar_naturais is null then
    raise exception 'Brumar em "Produtos naturais" não encontrado.';
  end if;

  -- 3. Descarta votos conflitantes: quem votou no Brumar rurais E em alguem
  --    em Produtos Naturais (pra preservar a escolha que a pessoa ja fez la)
  delete from votos
  where candidato_id = v_brumar_rurais
    and votante_id in (
      select votante_id from votos where subcategoria_id = v_sub_naturais
    );
  get diagnostics v_descartados = row_count;

  -- 4. Move os votos restantes pro candidato destino + atualiza subcategoria
  update votos
  set candidato_id = v_brumar_naturais,
      subcategoria_id = v_sub_naturais
  where candidato_id = v_brumar_rurais;
  get diagnostics v_movidos = row_count;

  -- 5. Apaga o Brumar de rurais
  delete from candidatos where id = v_brumar_rurais;

  raise notice 'OK: % votos do Brumar (rurais) transferidos pro Brumar (naturais), % descartados',
    v_movidos, v_descartados;
end $$;

-- Confirmação: deve voltar uma unica linha, Brumar em Produtos Naturais
select
  c.nome  as categoria,
  s.nome  as subcategoria,
  ca.nome as candidato,
  (select count(*) from votos v where v.candidato_id = ca.id) as votos
from candidatos ca
join subcategorias s on s.id = ca.subcategoria_id
join categorias c on c.id = s.categoria_id
where ca.nome ilike 'brumar%';
