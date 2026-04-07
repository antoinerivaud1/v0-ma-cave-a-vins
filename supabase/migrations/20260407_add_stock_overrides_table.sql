-- Migration 7 avril 2026 — Table stock_overrides pour migration localStorage→Supabase idempotente
-- Sprint 3.3 — Ticket 2 : migration sans collision
-- Exécuter manuellement dans Supabase SQL Editor

-- Table pour persister les surcharges de stock (quantité, archivage, suppression)
-- précédemment stockées uniquement en localStorage sous la clé cave-stock-overrides
CREATE TABLE IF NOT EXISTS stock_overrides (
  id                UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wine_identity_key TEXT        NOT NULL,
  quantity          INTEGER,
  archived          BOOLEAN     NOT NULL DEFAULT false,
  deleted           BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stock_overrides_unique_per_user UNIQUE (user_id, wine_identity_key)
);

-- Mise à jour automatique du champ updated_at
CREATE OR REPLACE FUNCTION set_stock_overrides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER stock_overrides_set_updated_at
  BEFORE UPDATE ON stock_overrides
  FOR EACH ROW EXECUTE FUNCTION set_stock_overrides_updated_at();

-- RLS : chaque utilisateur n'accède qu'à ses propres overrides
ALTER TABLE stock_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own stock overrides"
  ON stock_overrides
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
