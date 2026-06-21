-- ==========================================================================
-- 063-patrocinadores-2-niveis.sql
--
-- Simplifica niveis de patrocinio de 5 (master/ouro/prata/bronze/apoio)
-- pra 2 (patrocinio/apoio) com cotas:
--   - patrocinio: 1 cota por edicao (UNIQUE partial)
--   - apoio:      4 cotas por edicao (validado na API)
--
-- Migracao de dados existentes:
--   - master         → patrocinio (cota unica)
--   - ouro/prata/bronze/apoio → apoio
-- Se ja existir multiplos masters numa mesma edicao, mantem o mais
-- antigo como patrocinio e move os demais pra apoio.
-- ==========================================================================

-- 1) Solta o check constraint antigo
alter table patrocinadores
  drop constraint if exists patrocinadores_nivel_check;

-- 2) Migra dados: master vira patrocinio (so' o mais antigo), demais viram apoio
with masters_ranqueados as (
  select id,
         row_number() over (partition by edicao_id order by criado_em asc) as rn
  from patrocinadores
  where nivel = 'master'
),
masters_excedentes as (
  select id from masters_ranqueados where rn > 1
)
update patrocinadores
   set nivel = case
     when nivel = 'master' and id not in (select id from masters_excedentes) then 'patrocinio'
     else 'apoio'
   end;

-- 3) Adiciona check novo com so' 2 valores
alter table patrocinadores
  add constraint patrocinadores_nivel_check
  check (nivel in ('patrocinio','apoio'));

-- 4) Unique partial: 1 patrocinio ativo por edicao
drop index if exists ux_patrocinador_unico_por_edicao;
create unique index ux_patrocinador_unico_por_edicao
  on patrocinadores (edicao_id)
  where nivel = 'patrocinio' and ativo = true;

-- 5) Reconstroi index secundario (sem o ordering por nivel antigo)
drop index if exists idx_patrocinadores_edicao_nivel;
create index idx_patrocinadores_edicao_nivel
  on patrocinadores (edicao_id, nivel, ordem, nome)
  where ativo = true;
