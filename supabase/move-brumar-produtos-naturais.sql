-- Move "Brumar" (com seus votos) para a subcategoria "Produtos Naturais".
-- Conflito de unique (votante_id, subcategoria_id): se o votante ja votou
-- em alguem na sub destino, o voto antigo (na sub origem) e descartado
-- pra preservar a escolha que ele ja fez em Produtos Naturais.
-- Roda no SQL Editor do Supabase.

do $$
declare
  v_edicao       uuid;
  v_sub_destino  uuid;
  v_candidato    uuid;
  v_sub_origem   uuid;
  v_movidos      int;
  v_descartados  int;
begin
  select id into v_edicao from edicao where ativa = true limit 1;
  if v_edicao is null then
    raise exception 'Nenhuma edição ativa encontrada.';
  end if;

  -- 1. Acha a subcategoria "Produtos Naturais"
  select s.id into v_sub_destino
  from subcategorias s
  join categorias c on c.id = s.categoria_id
  where c.edicao_id = v_edicao
    and s.nome ilike 'produtos%natura%'
  limit 1;

  if v_sub_destino is null then
    raise exception 'Subcategoria "Produtos Naturais" não encontrada na edição ativa.';
  end if;

  -- 2. Acha o candidato "Brumar"
  select id, subcategoria_id into v_candidato, v_sub_origem
  from candidatos
  where nome ilike 'brumar%'
    and subcategoria_id in (
      select id from subcategorias where categoria_id in (
        select id from categorias where edicao_id = v_edicao
      )
    )
  limit 1;

  if v_candidato is null then
    raise exception 'Candidato "Brumar" não encontrado na edição ativa.';
  end if;

  if v_sub_origem = v_sub_destino then
    raise notice 'JA ESTA: Brumar ja esta em Produtos Naturais';
    return;
  end if;

  -- 3. Descarta votos conflitantes (votante ja votou na sub destino)
  delete from votos
  where candidato_id = v_candidato
    and votante_id in (
      select votante_id from votos where subcategoria_id = v_sub_destino
    );
  get diagnostics v_descartados = row_count;

  -- 4. Move candidato
  update candidatos
  set subcategoria_id = v_sub_destino
  where id = v_candidato;

  -- 5. Move votos restantes (sem conflito)
  update votos
  set subcategoria_id = v_sub_destino
  where candidato_id = v_candidato;
  get diagnostics v_movidos = row_count;

  raise notice 'OK: Brumar de % -> Produtos Naturais | % votos movidos, % descartados',
    v_sub_origem, v_movidos, v_descartados;
end $$;

-- Confirmação: deve mostrar Brumar sob "Produtos Naturais"
select
  c.nome  as categoria,
  s.nome  as subcategoria,
  ca.nome as candidato,
  (select count(*) from votos v where v.candidato_id = ca.id) as votos
from candidatos ca
join subcategorias s on s.id = ca.subcategoria_id
join categorias c on c.id = s.categoria_id
where ca.nome ilike 'brumar%';
