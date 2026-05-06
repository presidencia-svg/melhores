-- ==========================================================================
-- 035-edicao-id-denorm.sql
--
-- Denormaliza edicao_id em subcategorias, candidatos e votos. Hoje so existe
-- via FK transitiva (cand → sub → cat → edicao; voto → votante → edicao).
-- Pra queries multi-tenant rapidas e indexaveis, replicamos a coluna direto
-- nessas 3 tabelas. Sem isso, scoping por tenant exige JOINs em todo lugar.
--
-- Sequencia:
--   1. add nullable
--   2. backfill via FK chain
--   3. set NOT NULL
--   4. indexes
--
-- Producao do CDL Aracaju:
--   - subcategorias herda edicao_id de categorias (existing)
--   - candidatos herda de subcategorias (apos backfill em #1)
--   - votos herda de votantes (existing tem edicao_id)
--
-- Code que insere nessas tabelas deve setar edicao_id explicitamente apos
-- aplicar essa migration. Sem isso, INSERT falha com NOT NULL violation.
-- O codigo (commit acompanhante) ja foi atualizado.
--
-- Rollback:
--   alter table subcategorias drop column if exists edicao_id;
--   alter table candidatos drop column if exists edicao_id;
--   alter table votos drop column if exists edicao_id;
--   drop index if exists idx_subcategorias_edicao;
--   drop index if exists idx_candidatos_edicao;
--   drop index if exists idx_votos_edicao;
-- ==========================================================================

-- subcategorias.edicao_id (herda de categorias.edicao_id)
alter table subcategorias
  add column if not exists edicao_id uuid references edicao(id) on delete cascade;

update subcategorias s
  set edicao_id = c.edicao_id
  from categorias c
  where c.id = s.categoria_id and s.edicao_id is null;

alter table subcategorias alter column edicao_id set not null;
create index if not exists idx_subcategorias_edicao on subcategorias(edicao_id);

-- candidatos.edicao_id (herda de subcategorias.edicao_id)
alter table candidatos
  add column if not exists edicao_id uuid references edicao(id) on delete cascade;

update candidatos cand
  set edicao_id = s.edicao_id
  from subcategorias s
  where s.id = cand.subcategoria_id and cand.edicao_id is null;

alter table candidatos alter column edicao_id set not null;
create index if not exists idx_candidatos_edicao on candidatos(edicao_id);

-- votos.edicao_id (herda de votantes.edicao_id)
alter table votos
  add column if not exists edicao_id uuid references edicao(id) on delete cascade;

update votos v
  set edicao_id = vt.edicao_id
  from votantes vt
  where vt.id = v.votante_id and v.edicao_id is null;

alter table votos alter column edicao_id set not null;
create index if not exists idx_votos_edicao on votos(edicao_id);
