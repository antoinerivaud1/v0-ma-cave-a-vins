-- Migration 7 avril 2026 (réécrite le 12 septembre 2026, MA-111) — Table stock_overrides
-- Surcharges de stock par vin, clé = getWineIdentityKey() (hooks/use-stock-overrides.ts).
-- Schéma relevé sur la prod chriywwlnihmclbrjmta le 12/09/2026.
-- Remplace deux anciens fichiers divergents (wine_key/quantity et wine_identity_key/quantity/archived)
-- qui ne correspondaient ni l'un ni l'autre à la prod.
-- Idempotente (IF NOT EXISTS) — sûre à rejouer.

CREATE TABLE IF NOT EXISTS stock_overrides (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wine_identity_key text        NOT NULL,
  stock             integer     NOT NULL DEFAULT 0,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, wine_identity_key)
);

ALTER TABLE stock_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own stock overrides" ON stock_overrides;
CREATE POLICY "Users can manage their own stock overrides"
  ON stock_overrides
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
