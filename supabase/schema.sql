-- ==========================================================================
-- Melhores do Ano CDL Aracaju 2026 — Schema PostgreSQL (Supabase)
-- Execute este arquivo no SQL Editor do Supabase para criar todas as tabelas.
-- ==========================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- --------------------------------------------------------------------------
-- Configurações da edição (singleton)
-- --------------------------------------------------------------------------
create table if not exists edicao (
  id uuid primary key default gen_random_uuid(),
  ano int not null unique,
  nome text not null,
  inicio_votacao timestamptz not null,
  fim_votacao timestamptz not null,
  ativa boolean not null default true,
  criada_em timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Categorias e subcategorias (2 níveis)
-- --------------------------------------------------------------------------
create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  edicao_id uuid not null references edicao(id) on delete cascade,
  nome text not null,
  slug text not null,
  descricao text,
  icone text,
  ordem int not null default 0,
  ativa boolean not null default true,
  criada_em timestamptz not null default now(),
  unique (edicao_id, slug)
);

create table if not exists subcategorias (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references categorias(id) on delete cascade,
  nome text not null,
  slug text not null,
  descricao text,
  ordem int not null default 0,
  ativa boolean not null default true,
  criada_em timestamptz not null default now(),
  unique (categoria_id, slug)
);

-- --------------------------------------------------------------------------
-- Candidatos (oficial + sugerido)
-- --------------------------------------------------------------------------
create table if not exists candidatos (
  id uuid primary key default gen_random_uuid(),
  subcategoria_id uuid not null references subcategorias(id) on delete cascade,
  nome text not null,
  nome_normalizado text not null,
  descricao text,
  foto_url text,
  origem text not null default 'oficial' check (origem in ('oficial','sugerido')),
  status text not null default 'aprovado' check (status in ('aprovado','pendente','rejeitado','duplicado')),
  candidato_canonico_id uuid references candidatos(id) on delete set null,
  sugestoes_count int not null default 0,
  criado_em timestamptz not null default now()
);

create index if not exists idx_candidatos_subcategoria on candidatos(subcategoria_id) where status = 'aprovado';
create index if not exists idx_candidatos_nome_trgm on candidatos using gin (nome_normalizado gin_trgm_ops);
create index if not exists idx_candidatos_status on candidatos(status);

-- --------------------------------------------------------------------------
-- Votantes (1 registro por CPF/edição) — dados pessoais isolados
-- --------------------------------------------------------------------------
create table if not exists votantes (
  id uuid primary key default gen_random_uuid(),
  edicao_id uuid not null references edicao(id) on delete cascade,
  cpf_hash text not null,
  cpf text not null,
  nome text not null,
  selfie_url text,
  ip text,
  user_agent text,
  device_fingerprint text,
  whatsapp text,
  whatsapp_validado boolean not null default false,
  criado_em timestamptz not null default now(),
  unique (edicao_id, cpf_hash)
);

create index if not exists idx_votantes_ip on votantes(ip, criado_em desc);
create index if not exists idx_votantes_edicao on votantes(edicao_id);
create index if not exists idx_votantes_fingerprint
  on votantes(edicao_id, device_fingerprint)
  where device_fingerprint is not null;

-- --------------------------------------------------------------------------
-- Cache SPC (CPF → nome) — evita consultar o mesmo CPF mais de uma vez
-- --------------------------------------------------------------------------
create table if not exists spc_cache (
  cpf_hash text primary key,
  nome text not null,
  data_nascimento date,
  raw_response jsonb,
  consultado_em timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Códigos de validação WhatsApp
-- --------------------------------------------------------------------------
create table if not exists whatsapp_codigos (
  id uuid primary key default gen_random_uuid(),
  votante_id uuid not null references votantes(id) on delete cascade,
  whatsapp text not null,
  codigo text not null,
  tentativas int not null default 0,
  validado boolean not null default false,
  expira_em timestamptz not null,
  criado_em timestamptz not null default now()
);

create index if not exists idx_whatsapp_codigos_votante on whatsapp_codigos(votante_id, criado_em desc);

-- --------------------------------------------------------------------------
-- Votos (1 voto por votante por subcategoria)
-- --------------------------------------------------------------------------
create table if not exists votos (
  id uuid primary key default gen_random_uuid(),
  votante_id uuid not null references votantes(id) on delete cascade,
  subcategoria_id uuid not null references subcategorias(id) on delete cascade,
  candidato_id uuid not null references candidatos(id) on delete cascade,
  ip text,
  criado_em timestamptz not null default now(),
  unique (votante_id, subcategoria_id)
);

create index if not exists idx_votos_candidato on votos(candidato_id);
create index if not exists idx_votos_subcategoria on votos(subcategoria_id);

-- --------------------------------------------------------------------------
-- View de resultados em tempo real
-- --------------------------------------------------------------------------
create or replace view v_resultados as
select
  c.id as candidato_id,
  c.nome as candidato_nome,
  c.foto_url,
  c.origem,
  s.id as subcategoria_id,
  s.nome as subcategoria_nome,
  cat.id as categoria_id,
  cat.nome as categoria_nome,
  count(v.id) as total_votos
from candidatos c
join subcategorias s on s.id = c.subcategoria_id
join categorias cat on cat.id = s.categoria_id
left join votos v on v.candidato_id = c.id
where c.status = 'aprovado'
group by c.id, s.id, cat.id
order by cat.ordem, s.ordem, total_votos desc, c.nome;

-- --------------------------------------------------------------------------
-- Rate limit simples por IP (últimas tentativas de identificação)
-- --------------------------------------------------------------------------
create table if not exists rate_limit_ip (
  ip text not null,
  acao text not null,
  criado_em timestamptz not null default now(),
  primary key (ip, acao, criado_em)
);

create index if not exists idx_rate_limit_ip_recent on rate_limit_ip(ip, acao, criado_em desc);

-- --------------------------------------------------------------------------
-- Storage bucket para selfies (criar via Dashboard ou via SQL abaixo)
-- --------------------------------------------------------------------------
-- INSERT INTO storage.buckets (id, name, public) VALUES ('selfies', 'selfies', false)
-- ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------------
-- Funções RPC (fuzzy match + contadores)
-- --------------------------------------------------------------------------

create or replace function match_candidato_por_nome(
  p_subcategoria_id uuid,
  p_nome_normalizado text,
  p_threshold float default 0.55
)
returns table (id uuid, nome text, similaridade float, sugestoes_count int)
language sql stable as $$
  select c.id, c.nome,
         similarity(c.nome_normalizado, p_nome_normalizado) as similaridade,
         c.sugestoes_count
  from candidatos c
  where c.subcategoria_id = p_subcategoria_id
    and c.status = 'aprovado'
    and similarity(c.nome_normalizado, p_nome_normalizado) >= p_threshold
  order by similaridade desc
  limit 5;
$$;

create or replace function inc_sugestoes_count(p_id uuid)
returns void language sql as $$
  update candidatos set sugestoes_count = sugestoes_count + 1 where id = p_id;
$$;
