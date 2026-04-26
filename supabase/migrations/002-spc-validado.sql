-- Migration: marca quais votantes tiveram CPF validado via SPC (sample auditorial)
-- Roda no SQL Editor do Supabase.

alter table votantes
  add column if not exists spc_validado boolean not null default false,
  add column if not exists nome_autodeclarado text;

create index if not exists idx_votantes_spc_validado
  on votantes(edicao_id, spc_validado);
