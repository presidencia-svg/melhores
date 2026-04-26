-- ==========================================================================
-- Disparo de incentivo via WhatsApp para votantes em subcategorias acirradas.
--
-- 1. Adiciona timestamp de quando o votante recebeu o incentivo (one-shot).
-- 2. Função RPC `incentivo_elegives(threshold)` retorna a lista pronta para
--    o disparo: votantes que votaram no top 2 perdendo por <= `threshold`
--    votos, ainda não receberam incentivo, e têm whatsapp validado.
-- ==========================================================================

alter table votantes
  add column if not exists incentivo_enviado_em timestamptz;

create index if not exists idx_votantes_incentivo
  on votantes(incentivo_enviado_em)
  where whatsapp_validado = true;

-- Lista todos os votantes elegíveis para receber o incentivo.
-- threshold = diferença máxima de votos entre top 1 e top 2 da subcategoria.
create or replace function incentivo_elegives(p_threshold int default 5)
returns table (
  votante_id uuid,
  votante_nome text,
  whatsapp text,
  categoria_nome text,
  subcategoria_id uuid,
  subcategoria_nome text,
  candidato_perdendo_id uuid,
  candidato_perdendo_nome text,
  candidato_perdendo_votos bigint,
  candidato_lider_nome text,
  candidato_lider_votos bigint,
  diferenca bigint
)
language sql stable as $$
  with ranked as (
    select
      c.id as candidato_id,
      c.nome as candidato_nome,
      c.subcategoria_id,
      s.nome as subcategoria_nome,
      cat.nome as categoria_nome,
      count(v.id) as votos,
      row_number() over (
        partition by c.subcategoria_id
        order by count(v.id) desc, c.nome
      ) as rk
    from candidatos c
    join subcategorias s on s.id = c.subcategoria_id
    join categorias cat on cat.id = s.categoria_id
    left join votos v on v.candidato_id = c.id
    where c.status = 'aprovado'
    group by c.id, s.id, cat.id
  ),
  acirradas as (
    select
      t1.subcategoria_id,
      t1.subcategoria_nome,
      t1.categoria_nome,
      t1.candidato_id as top1_id,
      t1.candidato_nome as top1_nome,
      t1.votos as top1_votos,
      t2.candidato_id as top2_id,
      t2.candidato_nome as top2_nome,
      t2.votos as top2_votos,
      (t1.votos - t2.votos) as diff
    from ranked t1
    join ranked t2
      on t2.subcategoria_id = t1.subcategoria_id
     and t2.rk = 2
    where t1.rk = 1
      and (t1.votos - t2.votos) <= p_threshold
  )
  select
    vt.id,
    vt.nome,
    vt.whatsapp,
    a.categoria_nome,
    a.subcategoria_id,
    a.subcategoria_nome,
    a.top2_id,
    a.top2_nome,
    a.top2_votos,
    a.top1_nome,
    a.top1_votos,
    a.diff
  from acirradas a
  join votos v on v.candidato_id = a.top2_id
  join votantes vt on vt.id = v.votante_id
  where vt.whatsapp_validado = true
    and vt.whatsapp is not null
    and vt.incentivo_enviado_em is null
  order by a.diff asc, a.subcategoria_nome, vt.nome;
$$;
