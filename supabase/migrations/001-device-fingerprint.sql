-- Migration: adiciona device fingerprint para limitar CPFs por dispositivo
-- Roda no SQL Editor do Supabase.

alter table votantes
  add column if not exists device_fingerprint text;

create index if not exists idx_votantes_fingerprint
  on votantes(edicao_id, device_fingerprint)
  where device_fingerprint is not null;
