-- ==========================================================================
-- 045-toggle-sugestoes-publicas.sql
--
-- Toggle pro admin habilitar/desabilitar a sugestao publica de candidato
-- pelo votante na tela /votar/c/.../[subcategoria]. Quando desligadas, o
-- votante so escolhe entre os candidatos ja cadastrados pelo admin — sem
-- botao "Sugerir" e a API /api/sugerir-candidato retorna 403.
--
-- Util quando o admin quer uma campanha 100% curada (so candidatos
-- pre-aprovados) ou pra evitar enxurrada de sugestoes na reta final.
--
-- Valores: 'ligadas' (default — comportamento original) | 'desligadas'.
-- Backfilla todos os tenants existentes com 'ligadas' pra preservar
-- comportamento.
-- ==========================================================================

insert into app_config (tenant_id, chave, valor)
select id, 'sugestoes_publicas', 'ligadas' from tenants
on conflict (tenant_id, chave) do nothing;
