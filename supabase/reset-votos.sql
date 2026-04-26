-- ==========================================================================
-- RESET — apaga votos, votantes e candidatos para começar do zero
-- MANTÉM: edição, categorias e subcategorias
-- Roda no SQL Editor do Supabase.
-- ==========================================================================

begin;

-- 1. Códigos WhatsApp (depende de votantes)
delete from whatsapp_codigos;

-- 2. Votos (depende de votantes e candidatos)
delete from votos;

-- 3. Candidatos (oficiais e sugeridos)
delete from candidatos;

-- 4. Votantes
delete from votantes;

-- 5. Cache SPC (opcional — descomente se quiser forçar reconsulta na SPC)
-- delete from spc_cache;

-- 6. Rate limit (opcional — limpa janelas antigas)
delete from rate_limit_ip where criado_em < now() - interval '1 day';

commit;

-- Confirmação
select
  (select count(*) from edicao) as edicoes,
  (select count(*) from categorias) as categorias,
  (select count(*) from subcategorias) as subcategorias,
  (select count(*) from candidatos) as candidatos,
  (select count(*) from votantes) as votantes,
  (select count(*) from votos) as votos;
