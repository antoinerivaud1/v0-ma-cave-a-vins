-- MA-113 : stock cloud. Aligne stock_overrides sur hooks/use-stock-overrides.ts.
--
-- Avant (prod, relevé le 29/10/2026) : stock integer NOT NULL DEFAULT 0, pas de colonnes
-- archived / deleted, aucun trigger, 0 ligne.
--
-- Correspondance avec le code (lib/stock-sync.ts) :
--   StockOverride.quantity -> stock    (NULL = pas de surcharge, on garde wines.quantity)
--   StockOverride.archived -> archived
--   StockOverride.deleted  -> deleted  (suppression douce du vin)
--   updated_at             -> horodatage client de la dernière modification (dernier écrit gagne)
--
-- Migration additive et idempotente : peut être rejouée sans effet de bord.

-- 1. stock devient facultatif (une surcharge « archivé » seul ne doit pas forcer la quantité à 0)
ALTER TABLE public.stock_overrides ALTER COLUMN stock DROP NOT NULL;
ALTER TABLE public.stock_overrides ALTER COLUMN stock DROP DEFAULT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stock_overrides_stock_non_negative'
      AND conrelid = 'public.stock_overrides'::regclass
  ) THEN
    ALTER TABLE public.stock_overrides
      ADD CONSTRAINT stock_overrides_stock_non_negative CHECK (stock IS NULL OR stock >= 0);
  END IF;
END
$$;

-- 2. États d'archivage et de suppression
ALTER TABLE public.stock_overrides ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE public.stock_overrides ADD COLUMN IF NOT EXISTS deleted  boolean NOT NULL DEFAULT false;

-- 3. Dernier écrit gagne : une mise à jour plus ancienne que la ligne en base est ignorée.
--    updated_at est fourni par le client (heure de la modification, pas de la synchro) :
--    surtout pas de trigger qui le remplace par now().
CREATE OR REPLACE FUNCTION public.stock_overrides_keep_latest()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.updated_at < OLD.updated_at THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stock_overrides_keep_latest ON public.stock_overrides;
CREATE TRIGGER stock_overrides_keep_latest
  BEFORE UPDATE ON public.stock_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.stock_overrides_keep_latest();

-- 4. RLS inchangée (policy « Users can manage their own stock overrides », user_id = auth.uid()).

-- 5. Recharger le cache de schéma de l'API (normalement automatique)
NOTIFY pgrst, 'reload schema';
