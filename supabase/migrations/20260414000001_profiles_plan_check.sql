-- Migration 14 avril 2026 — Colonnes freemium sur profiles + contrainte plan
-- Sprint 3.5 — Plan free / amateur / collector
-- Idempotente (ADD COLUMN IF NOT EXISTS) — sûr de rejouer

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan                TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS role                TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS last_active_cave_id UUID REFERENCES caves(id) ON DELETE SET NULL;

-- Contrainte sur les valeurs autorisées du plan (idempotente via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_plan_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_plan_check
        CHECK (plan IN ('free', 'amateur', 'collector'));
  END IF;
END;
$$;

-- Contrainte sur les valeurs autorisées du rôle (idempotente via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_role_check
        CHECK (role IN ('user', 'beta', 'admin'));
  END IF;
END;
$$;

-- Trigger updated_at sur profiles
CREATE OR REPLACE FUNCTION set_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_profiles_updated_at();
