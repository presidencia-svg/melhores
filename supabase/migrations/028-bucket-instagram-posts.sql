-- ==========================================================================
-- 028-bucket-instagram-posts.sql
--
-- Cria bucket publico 'instagram-posts' pra hospedar os PNGs gerados pelos
-- cards do podium antes de mandar pra API do Instagram (a IG so aceita
-- imagens via URL publica, nao deixa subir base64 direto).
--
-- Os arquivos sao temporarios — depois que o post e' publicado, podemos
-- limpar via cron mensal. Por enquanto fica.
--
-- Roda no SQL Editor do Supabase. Idempotente.
-- ==========================================================================

-- Cria o bucket publico (publico = qualquer um com a URL le, sem precisar de signed URL)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'instagram-posts',
  'instagram-posts',
  true,
  5 * 1024 * 1024,  -- 5MB por arquivo (cards 1080x1920 dao ~1-2MB)
  array['image/png', 'image/jpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policy: service_role pode fazer tudo (a API faz upload via service_role)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'instagram_posts_service_all'
  ) then
    create policy "instagram_posts_service_all"
      on storage.objects
      for all
      to service_role
      using (bucket_id = 'instagram-posts')
      with check (bucket_id = 'instagram-posts');
  end if;
end$$;

-- Policy: leitura publica (necessario pra IG conseguir baixar a imagem)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'instagram_posts_public_read'
  ) then
    create policy "instagram_posts_public_read"
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'instagram-posts');
  end if;
end$$;
