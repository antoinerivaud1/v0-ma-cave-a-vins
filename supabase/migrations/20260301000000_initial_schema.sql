-- Migration 1 mars 2026 — Schéma initial : wines, profiles, caves
-- Tables de base créées au lancement du projet
-- Idempotente (IF NOT EXISTS) — sûr de rejouer

-- ============================================================
-- Table : profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- Table : caves
-- ============================================================
CREATE TABLE IF NOT EXISTS caves (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE caves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own caves"
  ON caves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own caves"
  ON caves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own caves"
  ON caves FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own caves"
  ON caves FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Table : wines
-- ============================================================
CREATE TABLE IF NOT EXISTS wines (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cave_id     UUID        REFERENCES caves(id) ON DELETE SET NULL,
  name        TEXT        NOT NULL,
  domain      TEXT,
  region      TEXT,
  appellation TEXT,
  vintage     TEXT,
  type        TEXT,
  quantity    INTEGER     NOT NULL DEFAULT 0,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE wines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wines"
  ON wines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wines"
  ON wines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wines"
  ON wines FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wines"
  ON wines FOR DELETE
  USING (auth.uid() = user_id);
