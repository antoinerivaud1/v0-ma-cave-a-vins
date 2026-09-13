-- Migration 12 septembre 2026 — Table tastings (Carnet de dégustation)
-- MA-111 : la table existait en prod (créée via SQL Editor) mais n'était pas versionnée.
-- Schéma relevé sur la prod chriywwlnihmclbrjmta le 12/09/2026 (list_tables + pg_policies + pg_indexes).
-- Idempotente (IF NOT EXISTS) — sûre à rejouer.

CREATE TABLE IF NOT EXISTS tastings (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wine_name        text        NOT NULL,
  millesime        text,
  region           text,
  appellation      text,
  wine_type        text,
  stars            integer     NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment          text        DEFAULT '',
  web_score        text,
  web_source       text,
  web_summary      text,
  web_enriched_at  timestamptz,
  cave_wine_ref    text,
  tasted_at        timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tastings_user_id_idx       ON tastings (user_id);
CREATE INDEX IF NOT EXISTS tastings_cave_wine_ref_idx ON tastings (cave_wine_ref);

ALTER TABLE tastings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own tastings" ON tastings;
CREATE POLICY "Users manage own tastings"
  ON tastings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
