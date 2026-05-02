-- ==========================================================================
-- 019-toggle-spc.sql
--
-- Toggle pro admin desabilitar a consulta SPC quando o servico cair (ja
-- aconteceu — relatos de "SPC indisponivel no momento" bloqueando novos
-- cadastros). Quando desligado, /api/identificar pula a validacao SPC e
-- usa o nome digitado pelo proprio votante (nome_autodeclarado).
--
-- Valores: 'obrigatorio' (default — bloqueia se SPC falha) ou 'desligado'.
-- ==========================================================================

insert into app_config (chave, valor)
values ('spc_consulta', 'obrigatorio')
on conflict (chave) do nothing;
