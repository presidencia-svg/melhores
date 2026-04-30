-- Move "Douglas Med", "CTI Farma" e "Vip Med" (com seus votos) para a
-- subcategoria "Produtos para Saúde".
-- Conflito de unique (votante_id, subcategoria_id): se o votante ja votou
-- em alguem na sub "Produtos para Saúde", o voto antigo (na sub origem)
-- pra esses 3 candidatos e descartado pra preservar a escolha que ele ja
-- fez na sub destino.
-- Roda no SQL Editor do Supabase.

do $$
declare
  v_edicao       uuid;
  v_sub_destino  uuid;
  v_candidato    uuid;
  v_sub_origem   uuid;
  v_nome_alvo    text;
  v_movidos      int;
  v_descartados  int;
  v_alvos text[] := array[
    'douglas%med%',
    'cti%farma%',
    'vip%med%'
  ];
begin
  select id into v_edicao from edicao where ativa = true limit 1;
  if v_edicao is null then
    raise exception 'Nenhuma edição ativa encontrada.';
  end if;

  -- 1. Acha a subcategoria "Produtos para Saúde"
  select s.id into v_sub_destino
  from subcategorias s
  join categorias c on c.id = s.categoria_id
  where c.edicao_id = v_edicao
    and s.nome ilike 'produtos%sa%de%'
  limit 1;

  if v_sub_destino is null then
    raise exception 'Subcategoria "Produtos para Saúde" não encontrada na edição ativa.';
  end if;

  -- 2. Move cada candidato
  foreach v_nome_alvo in array v_alvos loop
    select id, subcategoria_id into v_candidato, v_sub_origem
    from candidatos
    where nome ilike v_nome_alvo
      and subcategoria_id in (
        select id from subcategorias where categoria_id in (
          select id from categorias where edicao_id = v_edicao
        )
      )
    limit 1;

    if v_candidato is null then
      raise notice 'NAO ENCONTRADO: pattern %', v_nome_alvo;
      continue;
    end if;

    if v_sub_origem = v_sub_destino then
      raise notice 'JA ESTA: % esta em Produtos para Saúde', v_nome_alvo;
      continue;
    end if;

    -- Descarta votos conflitantes (votante ja votou na sub destino)
    delete from votos
    where candidato_id = v_candidato
      and votante_id in (
        select votante_id from votos where subcategoria_id = v_sub_destino
      );
    get diagnostics v_descartados = row_count;

    -- Move candidato
    update candidatos
    set subcategoria_id = v_sub_destino
    where id = v_candidato;

    -- Move votos restantes (sem conflito)
    update votos
    set subcategoria_id = v_sub_destino
    where candidato_id = v_candidato;
    get diagnostics v_movidos = row_count;

    raise notice 'OK %: de % -> Produtos para Saúde | % votos movidos, % descartados',
      v_nome_alvo, v_sub_origem, v_movidos, v_descartados;
  end loop;
end $$;

-- Confirmação: deve mostrar os 3 candidatos sob "Produtos para Saúde"
select
  c.nome  as categoria,
  s.nome  as subcategoria,
  ca.nome as candidato,
  (select count(*) from votos v where v.candidato_id = ca.id) as votos
from candidatos ca
join subcategorias s on s.id = ca.subcategoria_id
join categorias c on c.id = s.categoria_id
where ca.nome ilike 'douglas%med%'
   or ca.nome ilike 'cti%farma%'
   or ca.nome ilike 'vip%med%'
order by ca.nome;
