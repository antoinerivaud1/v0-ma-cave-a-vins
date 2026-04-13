-- Migration appliquée manuellement le 12 avril 2026
-- Aligne la contrainte plan avec les vrais plans produit
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'amateur', 'collector'));
UPDATE profiles SET plan = 'collector' WHERE plan = 'premium';
