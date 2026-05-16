-- ==========================================================================
-- 051-bucket-candidato-fotos.sql
--
-- Bucket publico 'candidato-fotos' pra admin subir foto de cada candidato
-- direto pelo painel (em vez de colar URL externa). Fotos aparecem na
-- lista do votante e nos cards de divulgacao.
--
-- Estrutura: candidato-fotos/<tenant_id>/<edicao_id>/<timestamp>.png
-- O caminho com tenant_id + edicao_id facilita limpeza por edicao.
--
-- Idempotente. Roda no SQL Editor do Supabase.
-- ==========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidato-fotos',
  'candidato-fotos',
  true,
  3 * 1024 * 1024,  -- 3MB por arquivo (foto JPG/PNG comum bem abaixo)
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- service_role pode tudo (API faz upload com service_role)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'candidato_fotos_service_all'
  ) then
    create policy "candidato_fotos_service_all"
      on storage.objects
      for all
      to service_role
      using (bucket_id = 'candidato-fotos')
      with check (bucket_id = 'candidato-fotos');
  end if;
end$$;

-- Leitura publica (foto aparece em votacao publica)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'candidato_fotos_public_read'
  ) then
    create policy "candidato_fotos_public_read"
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'candidato-fotos');
  end if;
end$$;
