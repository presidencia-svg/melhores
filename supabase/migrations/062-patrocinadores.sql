-- ==========================================================================
-- 062-patrocinadores.sql
--
-- Patrocinadores da edicao: logo + link + nivel (master/ouro/prata/bronze/apoio).
-- Aparece em: home publica, /votar (rodape), cerimonia LED (slide proprio),
-- podio Instagram (opcional), rodape global.
--
-- Scoped por edicao — cada ano pode ter patrocinadores diferentes. Ordem
-- de exibicao por (nivel, ordem, nome).
-- ==========================================================================

create table if not exists patrocinadores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  edicao_id uuid not null references edicao(id) on delete cascade,

  nome text not null,
  logo_url text not null,
  link text,  -- opcional, pode ser null pra so' exibir o logo

  -- master = logo gigante (capa, slide dedicado)
  -- ouro   = logo grande
  -- prata  = logo medio
  -- bronze = logo pequeno
  -- apoio  = logo discreto (rodape)
  nivel text not null default 'apoio'
    check (nivel in ('master','ouro','prata','bronze','apoio')),

  ordem int not null default 0,  -- desempate dentro do nivel
  ativo boolean not null default true,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_patrocinadores_edicao_nivel
  on patrocinadores (edicao_id, nivel, ordem, nome)
  where ativo = true;

create index if not exists idx_patrocinadores_tenant
  on patrocinadores (tenant_id);

-- RLS: leitura publica (pra renderizar no site), escrita so' service_role
alter table patrocinadores enable row level security;

drop policy if exists patrocinadores_select_public on patrocinadores;
create policy patrocinadores_select_public
  on patrocinadores for select
  to anon, authenticated
  using (ativo = true);

-- Bucket pra logos. Publico (precisa ser acessivel direto pelo browser
-- pra renderizar nas paginas). Limite 2MB, mime types restritos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patrocinadores-logos',
  'patrocinadores-logos',
  true,
  2 * 1024 * 1024,
  array['image/png','image/jpeg','image/webp','image/svg+xml']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public = true;

-- Trigger pra atualizar timestamp
create or replace function trg_patrocinadores_atualizado()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_patrocinadores_atualizado on patrocinadores;
create trigger trg_patrocinadores_atualizado
  before update on patrocinadores
  for each row execute function trg_patrocinadores_atualizado();
