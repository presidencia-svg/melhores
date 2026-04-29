-- Move "AM Malls Centro de Convenções" e "Salles Multieventos" (com seus
-- votos) para a subcategoria "Espaço de Eventos".
-- Roda no SQL Editor do Supabase.

do $$
declare
  v_edicao        uuid;
  v_sub_destino   uuid;
  v_total_movidos int := 0;
  rec             record;
  v_candidato     uuid;
  v_sub_origem    uuid;
  v_votos_movidos int;
  -- nomes (busca case/acento-insensitive via ilike e wildcards)
  c_nomes text[] := array[
    'am malls%',
    'salles multieventos%'
  ];
  c_nome text;
begin
  select id into v_edicao from edicao where ativa = true limit 1;
  if v_edicao is null then
    raise exception 'Nenhuma edição ativa encontrada.';
  end if;

  -- Acha a subcategoria "Espaço de Eventos" em qualquer categoria da edição
  select s.id into v_sub_destino
  from subcategorias s
  join categorias c on c.id = s.categoria_id
  where c.edicao_id = v_edicao
    and (s.nome ilike 'espa%o de eventos%' or s.slug ilike 'espaco%eventos%')
  limit 1;

  if v_sub_destino is null then
    raise exception 'Subcategoria "Espaço de Eventos" não encontrada.';
  end if;

  foreach c_nome in array c_nomes loop
    select ca.id, ca.subcategoria_id into v_candidato, v_sub_origem
    from candidatos ca
    join subcategorias s on s.id = ca.subcategoria_id
    join categorias c on c.id = s.categoria_id
    where c.edicao_id = v_edicao
      and ca.nome ilike c_nome
    limit 1;

    if v_candidato is null then
      raise warning 'Candidato com padrão "%" não encontrado — pulando.', c_nome;
      continue;
    end if;

    update candidatos set subcategoria_id = v_sub_destino where id = v_candidato;

    update votos set subcategoria_id = v_sub_destino where candidato_id = v_candidato;
    get diagnostics v_votos_movidos = row_count;

    raise notice 'OK — "%" (id=%) movido de % para %; % votos atualizados.',
      c_nome, v_candidato, v_sub_origem, v_sub_destino, v_votos_movidos;

    v_total_movidos := v_total_movidos + 1;
  end loop;

  raise notice 'Total de candidatos movidos: %', v_total_movidos;
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
where ca.nome ilike 'am malls%' or ca.nome ilike 'salles multieventos%'
order by ca.nome;
