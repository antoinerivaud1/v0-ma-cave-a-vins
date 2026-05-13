-- Migration 13 mai 2026 — Rattrapage idempotent wine_enrichments (MA-81)
--
-- Contexte: deux migrations conflictuelles existaient auparavant pour wine_enrichments.
-- Cette migration garantit que la table a EXACTEMENT le schéma attendu par lib/types.ts,
-- qu'elle soit créée from scratch ou héritée d'un état schéma 1 obsolète.
-- Idempotente: sûr de rejouer.

-- 1. Drop la colonne orpheline domain_info si elle existe (héritée du schéma 1)
ALTER TABLE wine_enrichments DROP COLUMN IF EXISTS domain_info;

-- 2. Ajouter les colonnes manquantes si absentes
ALTER TABLE wine_enrichments ADD COLUMN IF NOT EXISTS apogee_status text;
ALTER TABLE wine_enrichments ADD COLUMN IF NOT EXISTS domaine_history text;
ALTER TABLE wine_enrichments ADD COLUMN IF NOT EXISTS domaine_style text;
ALTER TABLE wine_enrichments ADD COLUMN IF NOT EXISTS bottle_image_url text;

-- 3. S'assurer que la contrainte CHECK sur apogee_status existe (drop-and-recreate sans casser les données)
ALTER TABLE wine_enrichments DROP CONSTRAINT IF EXISTS wine_enrichments_apogee_status_check;
ALTER TABLE wine_enrichments
  ADD CONSTRAINT wine_enrichments_apogee_status_check
  CHECK (apogee_status IS NULL OR apogee_status IN ('trop_jeune', 'a_boire', 'passe'));

-- 4. Vérification finale (échoue si la table n'a pas le schéma attendu)
DO $$
DECLARE
  expected_columns text[] := ARRAY[
    'id', 'wine_id', 'user_id', 'description', 'grape_varieties', 'taste_profile',
    'critic_score', 'price_min', 'price_max', 'apogee_start', 'apogee_end',
    'apogee_status', 'food_pairings', 'domaine_history', 'domaine_style',
    'bottle_image_url', 'created_at', 'updated_at'
  ];
  missing text[];
BEGIN
  SELECT array_agg(c) INTO missing
  FROM unnest(expected_columns) AS c
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wine_enrichments' AND column_name = c
  );

  IF missing IS NOT NULL AND array_length(missing, 1) > 0 THEN
    RAISE EXCEPTION 'wine_enrichments: colonnes manquantes après migration: %', missing;
  END IF;
END $$;
