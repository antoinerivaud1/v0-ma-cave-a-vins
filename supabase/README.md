# Supabase Migrations — Ma Cave à Vins

Ce dossier contient toutes les migrations SQL du projet, versionnées dans Git.

## Convention de nommage

```
YYYYMMDDHHMMSS_description_courte.sql
```

Exemples :
- `20260301000000_initial_schema.sql`
- `20260414000001_profiles_plan_check.sql`

Le timestamp doit être **unique** et **croissant** — il définit l'ordre d'application.

## Workflow obligatoire

> Toujours versionner **avant** d'appliquer. Une migration non versionnée est une migration perdue.

```
1. Créer le fichier SQL dans supabase/migrations/ (timestamp + description)
2. Committer sur la branche claude/* courante
3. Appliquer via MCP Supabase ou Supabase SQL Editor
4. Vérifier dans Supabase que la table / colonne / policy est bien créée
5. Merger via PR → develop
```

## Appliquer une migration manuellement via MCP Supabase

```bash
# Dans le terminal Claude Code, via l'outil MCP Supabase :
mcp__supabase__execute_sql --query "$(cat supabase/migrations/<fichier>.sql)"
```

Ou directement dans le **Supabase SQL Editor** (dashboard.supabase.com) :
1. Ouvrir le projet `chriywwlnihmclbrjmta`
2. SQL Editor → New query
3. Coller le contenu du fichier `.sql`
4. Run

## Toutes les migrations sont idempotentes

Chaque fichier utilise `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`,
ou des blocs `DO $$ ... $$` pour éviter les erreurs lors d'un rejeu.

## Ordre des migrations

| Fichier | Date | Contenu |
|---|---|---|
| `20260301000000_initial_schema.sql` | 1 mars 2026 | Tables `wines`, `profiles`, `caves` + RLS |
| `20260401000000_stock_overrides.sql` | 1 avril 2026 | Table `stock_overrides` + RLS |
| `20260406_add_missing_columns.sql` | 6 avril 2026 | Colonnes manquantes `wines` + trigger `updated_at` |
| `20260407_add_stock_overrides_table.sql` | 7 avril 2026 | Variante stock_overrides avec `archived`/`deleted` |
| `20260414000000_wine_enrichments.sql` | 14 avril 2026 | Table `wine_enrichments` + RLS |
| `20260414000001_profiles_plan_check.sql` | 14 avril 2026 | Colonnes `plan`/`role` + contrainte freemium |
| `20260414_create_wine_enrichments.sql` | 14 avril 2026 | Migration originale `wine_enrichments` (référence) |

## RLS — règle universelle

Toutes les tables ont RLS activé. La policy de base :

```sql
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)
```

Ne jamais créer une table sans activer RLS et ajouter les policies correspondantes.

## Schéma des tables principales

### wines
| Colonne | Type | Notes |
|---|---|---|
| id | UUID PK | gen_random_uuid() |
| user_id | UUID FK | auth.users |
| cave_id | UUID FK | caves.id, nullable |
| name | TEXT | sanitizeWineName() côté app |
| domain | TEXT | |
| region | TEXT | |
| appellation | TEXT | |
| vintage | TEXT | |
| type | TEXT | |
| quantity | INTEGER | défaut 0 |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | trigger auto |

### profiles
| Colonne | Type | Notes |
|---|---|---|
| id | UUID PK FK | auth.users |
| plan | TEXT | free / amateur / collector |
| role | TEXT | user / beta / admin |
| last_active_cave_id | UUID FK | caves.id, nullable |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | trigger auto |

### caves
| Colonne | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | auth.users |
| name | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### stock_overrides
| Colonne | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | auth.users |
| wine_key | TEXT | getWineIdentityKey() |
| quantity | INTEGER | nullable |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | trigger auto |

### wine_enrichments
| Colonne | Type | Notes |
|---|---|---|
| id | UUID PK | |
| wine_id | UUID FK | wines.id |
| user_id | UUID FK | auth.users |
| description | TEXT | |
| grape_varieties | JSONB | |
| taste_profile | JSONB | |
| critic_score | INTEGER | |
| price_min | NUMERIC | |
| price_max | NUMERIC | |
| apogee_start | INTEGER | |
| apogee_end | INTEGER | |
| food_pairings | JSONB | |
| domain_info | JSONB | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | trigger auto |
