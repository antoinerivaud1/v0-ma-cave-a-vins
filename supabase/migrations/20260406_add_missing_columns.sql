-- Migration 6 avril 2026 — Colonnes manquantes détectées via audit Sprint 3.3
-- Exécutée manuellement dans Supabase SQL Editor le 6 avril 2026

ALTER TABLE wines
  ADD COLUMN IF NOT EXISTS vintage        TEXT,
  ADD COLUMN IF NOT EXISTS quantity       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS region         TEXT,
  ADD COLUMN IF NOT EXISTS appellation    TEXT,
  ADD COLUMN IF NOT EXISTS domain         TEXT,
  ADD COLUMN IF NOT EXISTS wine_type      TEXT,
  ADD COLUMN IF NOT EXISTS classification TEXT,
  ADD COLUMN IF NOT EXISTS notes          TEXT,
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT now();

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER wines_set_updated_at
  BEFORE UPDATE ON wines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan                TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS role                TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS last_active_cave_id UUID;
