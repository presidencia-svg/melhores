-- ==========================================================================
-- 061-rpc-lockdown-round2.sql
--
-- Segunda rodada de RPC lockdown (a primeira foi 056). Permission audit
-- revelou que ~17 RPCs da app ainda estavam EXECUTAVEIS por anon e
-- authenticated. Como Supabase expoe automaticamente RPCs no schema
-- public via PostgREST, qualquer um com a anon key (publica, presente
-- no front) podia chamar:
--
-- 🚨 PII DIRETA (LGPD):
--   - votantes_listagem(uuid, int, int) — devolvia nome, CPF, IP, UA,
--     fingerprint, whatsapp, selfie_url de TODOS os votantes da edicao.
--     Catastrofico.
--
-- 🚨 LISTAS DE ELEGIVEIS (nome + whatsapp):
--   - elegiveis_cerimonia, incentivo_elegives, incentivo_elegives_empate
--   - parcial_elegives_auto, parcial_subcats_votante
--
-- 🚨 METRICAS AGREGADAS / INTELIGENCIA:
--   - numeros_campanha, insights_funil, insights_incentivo_roi,
--     insights_origem, insights_otp_periodo, insights_parcial_roi,
--     insights_subs_aceleracao, insights_votos_heatmap,
--     insights_votos_periodo
--
-- Defesa em profundidade:
--   - match_candidato_por_nome / inc_sugestoes_count: usadas no fluxo
--     publico (/api/sugerir-candidato), mas pela app via service_role,
--     entao revoga tambem.
--   - nome_precisa_revisao / to_title_case_pt: utilitarios sem dados,
--     mas revoga por defesa.
--
-- Mantidas abertas (extensoes do PG, sem dados):
--   - pg_trgm (gtrgm_*, gin_*, set_limit, show_limit, show_trgm,
--     similarity*, word_similarity*, strict_word_similarity*,
--     levenshtein*)
--   - fuzzystrmatch (daitch_mokotoff, dmetaphone*, metaphone,
--     soundex, text_soundex, difference)
--   - postgres_fdw_*
--   - tg_tenants_atualizado_em (trigger)
--
-- Idempotente: REVOKE de ja-nao-existente nao falha; GRANT idem.
-- ==========================================================================

-- PII direta — assinatura conhecida, mais explicito
revoke execute on function public.votantes_listagem(uuid, integer, integer)
  from public, anon, authenticated;
grant execute on function public.votantes_listagem(uuid, integer, integer)
  to service_role;

-- Restantes via DO block pra cobrir assinaturas variadas
do $$ declare r record;
begin
  for r in (
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public'
      and p.proname in (
        'elegiveis_cerimonia',
        'incentivo_elegives',
        'incentivo_elegives_empate',
        'parcial_elegives_auto',
        'parcial_subcats_votante',
        'numeros_campanha',
        'insights_funil',
        'insights_incentivo_roi',
        'insights_origem',
        'insights_otp_periodo',
        'insights_parcial_roi',
        'insights_subs_aceleracao',
        'insights_votos_heatmap',
        'insights_votos_periodo',
        'match_candidato_por_nome',
        'inc_sugestoes_count',
        'nome_precisa_revisao',
        'to_title_case_pt'
      )
  ) loop
    execute format('revoke execute on function public.%I(%s) from public, anon, authenticated',
                   r.proname, r.args);
    execute format('grant execute on function public.%I(%s) to service_role',
                   r.proname, r.args);
  end loop;
end $$;
