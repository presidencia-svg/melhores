-- ==========================================================================
-- 058-bucket-selfies-limits.sql
--
-- Bug: bucket 'selfies' (49k+ objetos com PII) tinha file_size_limit=null
-- e allowed_mime_types=null. Como o bucket e' privado e zero policies,
-- so service_role escreve (a app via /api/selfie). Mas defesa em
-- profundidade: limita no bucket tambem, pra cobrir caso futuro de
-- bug na app que aceite mime/size errados.
--
-- Combinado com a validacao rigorosa em /api/selfie (regex restrito
-- a png/jpeg/webp + bytes.length < 3MB), agora ha 2 camadas:
--   1. App rejeita antes de subir
--   2. Bucket rejeita se app for bypass
--
-- Idempotente: update.
-- ==========================================================================

update storage.buckets
   set file_size_limit = 3 * 1024 * 1024,
       allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
 where id = 'selfies';
