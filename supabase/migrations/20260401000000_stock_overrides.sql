-- Migration 1 avril 2026 — Table stock_overrides
-- Persistance des surcharges de stock (anciennement en localStorage)
-- Idempotente (IF NOT EXISTS) — sûr de rejouer

CREATE TABLE IF NOT EXISTS stock_overrides (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wine_key         TEXT        NOT NULL,
  quantity         INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stock_overrides_unique_per_user UNIQUE (user_id, wine_key)
);

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

ALTER TABLE stock_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stock overrides"
  ON stock_overrides FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stock overrides"
  ON stock_overrides FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stock overrides"
  ON stock_overrides FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stock overrides"
  ON stock_overrides FOR DELETE
  USING (auth.uid() = user_id);
