-- ==========================================================================
-- Atualiza a edição ativa de "2026" para "2025".
--
-- A coluna `edicao.ano` tem UNIQUE constraint, então se já existir algum
-- registro com ano=2025, este UPDATE falha — apague-o antes ou ajuste.
--
-- Roda no SQL Editor do Supabase.
-- ==========================================================================

-- 1) PREVIEW: estado atual
select id, ano, nome, ativa, inicio_votacao, fim_votacao
from edicao
order by ano desc;

-- 2) UPDATE — descomente quando o preview estiver OK
-- update edicao
--    set ano = 2025,
--        nome = 'Melhores do Ano CDL Aracaju 2025'
--  where ativa = true
--    and ano = 2026;

-- 3) Confirmação pós-update
-- select id, ano, nome, ativa from edicao order by ano desc;
