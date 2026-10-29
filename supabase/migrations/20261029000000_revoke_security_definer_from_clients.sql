-- MA-114 : fonctions SECURITY DEFINER exécutables par anon (audit sécurité du 24/10/2026)
--
-- Constat en prod (29/10/2026) : increment_rate_limit et rls_auto_enable portent l'ACL
-- {=X/postgres, anon=X, authenticated=X, service_role=X}. Le « =X » est PUBLIC : n'importe
-- quel rôle, y compris anon via /rest/v1/rpc, peut les exécuter.
--
-- Qui appelle quoi :
--   increment_rate_limit : uniquement lib/rate-limit.ts, côté serveur (routes /api/scan-label
--     et /api/enrich-wine), avec la clé SUPABASE_SERVICE_ROLE_KEY. Aucun appel navigateur.
--     On garde donc service_role seul.
--   rls_auto_enable : fonction de l'event trigger ensure_rls (active RLS sur toute table créée
--     dans public). Jamais appelée par l'app. Un event trigger s'exécute sans vérifier le
--     privilège EXECUTE de l'utilisateur qui lance le DDL : le revoke ne le désactive pas.
--
-- Idempotent : peut être rejoué sans effet de bord.

-- 1. increment_rate_limit : search_path figé (lint Supabase 0011) + table qualifiée.
--    Corps identique à 20260514_create_api_rate_limits.sql. CREATE OR REPLACE conserve l'ACL,
--    elle est corrigée juste après.
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_user_id      uuid,
  p_route        text,
  p_window_start timestamptz
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_count int;
BEGIN
  INSERT INTO public.api_rate_limits (user_id, route, window_start, count)
  VALUES (p_user_id, p_route, p_window_start, 1)
  ON CONFLICT (user_id, route, window_start)
  DO UPDATE SET count = api_rate_limits.count + 1
  RETURNING count INTO new_count;

  RETURN new_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_rate_limit(uuid, text, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_rate_limit(uuid, text, timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_rate_limit(uuid, text, timestamptz) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_rate_limit(uuid, text, timestamptz) TO service_role;

-- 2. rls_auto_enable : créée en prod par le dashboard Supabase, absente des migrations du dépôt.
--    Revoke conditionnel pour que ce fichier passe aussi sur une base vierge.
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
  END IF;
END
$$;
