-- Migration 14 avril 2026 — Table wine_enrichments pour cache enrichissement IA
-- Sprint 3.5 — Ticket MA-5 : Fiche Vin Enrichie
-- Idempotente (IF NOT EXISTS) — exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS wine_enrichments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  wine_id          uuid        NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description      text,
  grape_varieties  jsonb,
  taste_profile    jsonb,
  critic_score     integer,
  price_min        numeric,
  price_max        numeric,
  apogee_start     integer,
  apogee_end       integer,
  apogee_status    text CHECK (apogee_status IN ('trop_jeune', 'a_boire', 'passe')),
  food_pairings    jsonb,
  domaine_history  text,
  domaine_style    text,
  bottle_image_url text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(wine_id, user_id)
);

-- Trigger updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_wine_enrichments_updated_at
  BEFORE UPDATE ON wine_enrichments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS obligatoire
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
