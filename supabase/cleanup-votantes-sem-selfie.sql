-- ==========================================================================
-- Apaga votantes que nunca completaram a selfie (selfie_url IS NULL).
-- Como `votos` e `whatsapp_codigos` referenciam votantes via ON DELETE CASCADE,
-- qualquer voto/código órfão desses votantes é apagado junto.
--
-- Em produção, depois do refactor "criar votante só após validar selfie",
-- esse cenário não acontece mais — ficaria só pra limpar dados legados.
--
-- Roda no SQL Editor do Supabase.
-- ==========================================================================

-- PREVIEW: quantos serão apagados?
select
  count(*) filter (where selfie_url is null) as sem_selfie,
  count(*) filter (where selfie_url is not null) as com_selfie,
  count(*) as total
from votantes;

-- Lista (até 50) dos que vão sumir
select id, nome, criado_em, ip
from votantes
where selfie_url is null
order by criado_em desc
limit 50;

-- DELETE — descomente quando estiver seguro
-- delete from votantes where selfie_url is null;

-- Confirmação pós-delete
-- select count(*) as votantes_restantes from votantes;
