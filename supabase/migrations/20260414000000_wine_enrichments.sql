-- Migration 14 avril 2026 — Table wine_enrichments
-- Cache enrichissement IA (Sprint 3.5 — MA-5 : Fiche Vin Enrichie)
-- Idempotente (IF NOT EXISTS) — sûr de rejouer

CREATE TABLE IF NOT EXISTS wine_enrichments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wine_id          UUID        NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description      TEXT,
  grape_varieties  JSONB,
  taste_profile    JSONB,
  critic_score     INTEGER,
  price_min        NUMERIC,
  price_max        NUMERIC,
  apogee_start     INTEGER,
  apogee_end       INTEGER,
  food_pairings    JSONB,
  domain_info      JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wine_id, user_id)
);

CREATE OR REPLACE FUNCTION update_wine_enrichments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER wine_enrichments_set_updated_at
  BEFORE UPDATE ON wine_enrichments
  FOR EACH ROW EXECUTE FUNCTION update_wine_enrichments_updated_at();

ALTER TABLE wine_enrichments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrichments"
  ON wine_enrichments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrichments"
  ON wine_enrichments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrichments"
  ON wine_enrichments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own enrichments"
  ON wine_enrichments FOR DELETE
  USING (auth.uid() = user_id);
