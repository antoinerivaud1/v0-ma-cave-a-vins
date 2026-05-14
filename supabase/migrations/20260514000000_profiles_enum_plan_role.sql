-- Migration 14 mai 2026 — Enum plan + role sur profiles
-- Remplace les contraintes CHECK par des types enum PostgreSQL natifs.
-- Avantage : Supabase Table Editor affiche un dropdown pour ces colonnes.
-- Idempotente : sûr de rejouer.

-- 1. Créer les types enum si absents
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_plan') THEN
    CREATE TYPE user_plan AS ENUM ('free', 'amateur', 'collector');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'beta', 'admin');
  END IF;
END $$;

-- 2. Supprimer les anciennes contraintes CHECK (remplacées par les enums)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 3. Dropper les DEFAULT TEXT avant le changement de type (requis par PostgreSQL)
ALTER TABLE profiles ALTER COLUMN plan DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- 4. Migrer les colonnes vers les types enum
--    USING convertit les valeurs TEXT existantes
--    COALESCE sur role : NULL → 'user' par sécurité
ALTER TABLE profiles
  ALTER COLUMN plan TYPE user_plan USING plan::user_plan,
  ALTER COLUMN role TYPE user_role USING COALESCE(role, 'user')::user_role;

-- 5. Remettre les DEFAULT avec le bon type enum
ALTER TABLE profiles ALTER COLUMN plan SET DEFAULT 'free'::user_plan;
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user'::user_role;
