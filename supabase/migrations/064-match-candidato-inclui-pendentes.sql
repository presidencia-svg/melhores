-- ==========================================================================
-- 064-match-candidato-inclui-pendentes.sql
--
-- Bug: no modo de sugestao "aprovacao", o votante sugere um candidato
-- novo (entra como pendente) e quando outro votante sugere o MESMO
-- nome, a RPC match_candidato_por_nome nao encontra o anterior (so'
-- buscava 'aprovado') — entao um segundo "pendente" duplicado e' criado.
--
-- Fix: passa a buscar 'aprovado' E 'pendente'. Mantem prioridade pros
-- aprovados na ordenacao (se houver dos dois, match no aprovado).
-- ==========================================================================

create or replace function public.match_candidato_por_nome(
  p_subcategoria_id uuid,
  p_nome_normalizado text,
  p_threshold double precision default 0.55
) returns table (
  id uuid, nome text, similaridade double precision, sugestoes_count integer
)
language sql stable as $$
  select c.id, c.nome,
         similarity(c.nome_normalizado, p_nome_normalizado) as similaridade,
         c.sugestoes_count
  from candidatos c
  where c.subcategoria_id = p_subcategoria_id
    and c.status in ('aprovado', 'pendente')
    and similarity(c.nome_normalizado, p_nome_normalizado) >= p_threshold
  order by
    case when c.status = 'aprovado' then 0 else 1 end,
    similaridade desc
  limit 5;
$$;
