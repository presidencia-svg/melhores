-- ==========================================================================
-- 053-cerimonia-led.sql
--
-- Suporte ao video da cerimonia em painel LED 2048x768. Tabela separada
-- de candidatos pra cerimonia ser flexivel: nem todo slide precisa ser
-- candidato cadastrado, e cada cerimonia tem ordem propria.
--
-- Slides sao por tenant + edicao. Admin importa planilha do Excel pra
-- popular tudo de uma vez + sobe logo de cada empresa.
--
-- Bucket 'cerimonia-logos' publico (slideshow renderiza no browser que
-- vai gravar com OBS — precisa de acesso direto).
-- ==========================================================================

create table if not exists cerimonia_slides (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  edicao_id uuid references edicao(id) on delete set null,
  ordem integer not null default 0,
  empresa text not null,
  recebe text,
  instagram text,
  logo_url text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_cerimonia_slides_tenant_ordem
  on cerimonia_slides(tenant_id, ordem);

-- Bucket pra logos das empresas (separado de candidato-fotos pra nao
-- misturar com fotos de candidatos cadastrados)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cerimonia-logos',
  'cerimonia-logos',
  true,
  3 * 1024 * 1024,
  array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'cerimonia_logos_service_all'
  ) then
    create policy "cerimonia_logos_service_all"
      on storage.objects
      for all
      to service_role
      using (bucket_id = 'cerimonia-logos')
      with check (bucket_id = 'cerimonia-logos');
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'cerimonia_logos_public_read'
  ) then
    create policy "cerimonia_logos_public_read"
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'cerimonia-logos');
  end if;
end$$;
