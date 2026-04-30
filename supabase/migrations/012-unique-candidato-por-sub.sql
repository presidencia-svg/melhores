-- ==========================================================================
-- 012-unique-candidato-por-sub.sql
--
-- Bloqueia nome duplicado na mesma subcategoria entre candidatos APROVADOS.
-- Usa index unico parcial — duplicidades em status pendente/rejeitado/duplicado
-- continuam permitidas (necessario pra historico de sugestoes que viraram
-- duplicatas marcadas).
--
-- ATENCAO: se ja existir duplicata aprovada, esta migration FALHA. Antes de
-- rodar, mescle/exclua via /admin/candidatos (a UI ja sinaliza os duplicados
-- com badge laranja "duplicado" e tem botao de mesclar).
--
-- Pra ver duplicatas atuais:
--   select subcategoria_id, nome_normalizado, count(*), array_agg(id), array_agg(nome)
--   from candidatos
--   where status = 'aprovado'
--   group by subcategoria_id, nome_normalizado
--   having count(*) > 1;
-- ==========================================================================

create unique index if not exists uq_candidatos_sub_nome_aprovado
on candidatos (subcategoria_id, nome_normalizado)
where status = 'aprovado';
