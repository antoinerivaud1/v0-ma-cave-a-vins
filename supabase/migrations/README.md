# Migrations Supabase

Ces fichiers sont la **référence versionnée du schéma** de la prod `chriywwlnihmclbrjmta`.
Ils ont été appliqués via le SQL Editor / MCP Supabase, pas via `supabase db push` :
l'historique `supabase_migrations.schema_migrations` en prod ne porte donc pas ces noms
(4 entrées au 12/09/2026 : create_stock_overrides, fix_profiles_plan_constraint,
create_wine_enrichments, create_api_rate_limits).

Règles :
- Toute modification de schéma en prod doit avoir son fichier ici, dans le même PR.
- Fichiers idempotents (`IF NOT EXISTS`, `DROP POLICY IF EXISTS` avant `CREATE POLICY`).
- Nommage `YYYYMMDDHHMMSS_description.sql`.
- Un seul fichier par table créée. Les doublons supprimés le 12/09/2026 (MA-111) :
  - `20260401000000_stock_overrides.sql` et `20260407_add_stock_overrides_table.sql` (colonnes
    `wine_key`/`quantity`/`archived` inexistantes en prod) remplacés par
    `20260407000000_create_stock_overrides.sql` relevé sur la prod (`wine_identity_key`, `stock`).
  - Le doublon `20260414000000_wine_enrichments.sql`
  (schéma obsolète avec `domain_info`) a été supprimé le 12/09/2026 (MA-111) :
  il s'exécutait avant `20260414_create_wine_enrichments.sql` sur une base vierge
  et produisait un schéma divergent de la prod.

Tables en prod (12/09/2026) : `profiles`, `caves`, `wines`, `tastings`, `stock_overrides`,
`wine_enrichments`, `api_rate_limits`. RLS activé partout.

## Fonctions SECURITY DEFINER (MA-114, 29/10/2026)

Les privilèges par défaut du schéma `public` donnent EXECUTE à `anon` et `authenticated` sur
toute nouvelle fonction. Une fonction SECURITY DEFINER est donc appelable par n'importe qui via
`/rest/v1/rpc/<nom>` tant qu'on ne retire pas ce droit.

Règle : toute fonction SECURITY DEFINER créée ici est suivie, dans le même fichier, de
`SET search_path = ''` et de `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` (puis
`GRANT EXECUTE ... TO service_role` si le serveur l'appelle). Exemple :
`20261029000000_revoke_security_definer_from_clients.sql`.

- `increment_rate_limit` : service_role uniquement (`lib/rate-limit.ts`, routes API serveur).
- `rls_auto_enable` : fonction de l'event trigger `ensure_rls`, créée par le dashboard Supabase
  (absente de ce dossier). Le trigger fonctionne sans EXECUTE pour l'utilisateur qui lance le DDL.
