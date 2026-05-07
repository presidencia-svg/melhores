-- ==========================================================================
-- 040-bucket-tenant-logos.sql
--
-- Bucket publico 'tenant-logos' pra cada tenant subir sua propria marca
-- (CDL, SESI, instituicao). Logo aparece no painel administrativo,
-- pagina publica de votacao, certificados e cards do Instagram.
--
-- Estrutura: tenant-logos/<tenant_id>/<timestamp>.png
-- O caminho com tenant_id no prefixo evita colisao + facilita policy.
--
-- Idempotente. Roda no SQL Editor do Supabase.
-- ==========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tenant-logos',
  'tenant-logos',
  true,
  2 * 1024 * 1024,  -- 2MB por arquivo (logo PNG/SVG fica abaixo facil)
  array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
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
      and policyname = 'tenant_logos_service_all'
  ) then
    create policy "tenant_logos_service_all"
      on storage.objects
      for all
      to service_role
      using (bucket_id = 'tenant-logos')
      with check (bucket_id = 'tenant-logos');
  end if;
end$$;

-- Leitura publica (logo aparece em votacao publica + certificados publicos)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'tenant_logos_public_read'
  ) then
    create policy "tenant_logos_public_read"
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'tenant-logos');
  end if;
end$$;
