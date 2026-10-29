# MA-113 : stock cloud (Supabase source de vérité) avec cache local

Décision Antoine du 12/09/2026 : option A. `[OVERRIDE]` accordé sur `hooks/use-stock-overrides.ts`.

## Diagnostic revalidé le 29/10/2026 (lecture seule prod + code develop)

- `stock_overrides` en prod : `id, user_id, wine_identity_key, stock integer NOT NULL DEFAULT 0, updated_at`, unique `(user_id, wine_identity_key)`, RLS `FOR ALL user_id = auth.uid()`, aucun trigger, 0 ligne.
- `use-cave-sync.ts` upsert `quantity/archived/deleted` : colonnes inexistantes, erreur avalée. De plus l'étape n'est jamais rejouée pour un compte déjà migré (retour anticipé sur `cave-migration-done`) : les surcharges locales d'Antoine ne seraient jamais envoyées, même après correction du schéma.
- `use-stock-overrides.ts` : localStorage uniquement.
- `/api/reset-user` supprime déjà `stock_overrides` (service role, en premier).

## Schéma cible (figé)

| Colonne | Type | Sens |
|---|---|---|
| `stock` | integer NULL, CHECK >= 0 | quantité surchargée. NULL = pas de surcharge (on garde `wines.quantity`). Côté code : `StockOverride.quantity` |
| `archived` | boolean NOT NULL DEFAULT false | |
| `deleted` | boolean NOT NULL DEFAULT false | suppression douce du vin |
| `updated_at` | timestamptz | horodatage **client** de la dernière modification (dernier écrit gagne) |

Trigger `stock_overrides_keep_latest` (BEFORE UPDATE) : ignore une mise à jour plus ancienne que la ligne en base, pour que « dernier écrit gagne » tienne même si deux appareils écrivent en même temps.

On garde le nom `stock` (prod) plutôt que renommer en `quantity` : migration purement additive.

## Architecture

- `lib/stock-sync.ts` (pur, testé) : mapping ligne <-> override, fusion « cloud source de vérité + modifications locales en attente, dernier écrit gagne ».
- `hooks/use-stock-overrides.ts` (store module, `useSyncExternalStore` inchangé pour les composants) :
  - `cave-stock-overrides` garde exactement son format (compatible retour arrière) ; métadonnées de synchro dans une nouvelle clé `cave-stock-sync` (propriétaire, horodatages, file d'attente, vidage cloud en attente).
  - Chaque écriture locale part en file d'attente ; synchro différée (1,2 s), au retour réseau, au retour au premier plan, et en reprise exponentielle (30 s à 10 min) après un échec.
  - Synchro : vérifie la session, applique un vidage en attente, lit le cloud (paginé), fusionne, pousse les clés locales gagnantes (upsert `onConflict user_id,wine_identity_key`, donc jamais de doublon).
  - Échec (réseau, colonnes absentes tant que le SQL n'est pas collé) : rien n'est modifié localement, la file reste, nouvel essai plus tard. Aucune erreur visible (console.error seulement).
  - Surcharges locales antérieures (sans métadonnées) : rattachées au premier compte connecté, mises en file avec un horodatage 1970 (le cloud gagne en cas de conflit).
  - Autre compte connecté sur le même appareil : cache local remis à zéro (les clés `id:` d'un compte ne valent rien pour un autre).
  - `clearAllStockOverrides()` (import Excel, reset) : vide local + cloud via un repère `clearAt` persistant (retenté si le réseau coupe).
- `use-cave-sync.ts` : l'étape stock sort du flag one-shot. Au SIGNED_IN, `startStockOverridesSync(userId)` (synchrone, local) rattache et met en file ; l'envoi se fait hors du callback d'auth. Le stock n'est « migré » qu'une fois confirmé par Supabase (file vide).

## Déploiement

Le code dégrade proprement si la migration n'est pas encore appliquée. Ordre conseillé : coller le SQL, puis merger. L'ordre inverse ne perd rien.

## Tests

- `tests/stock-overrides.test.ts` : mapping, fusion (local plus récent, cloud plus récent, égalité, clé absente, héritage 1970).
- `tests/stock-overrides-store.test.ts` : store contre un faux Supabase en mémoire (colonnes absentes puis présentes, consommer / archiver / restaurer / supprimer, second appareil, réconciliation sans doublon, dernier écrit gagne, hors ligne, écriture pendant l'envoi, autre compte, vidage après coupure, anciennes clés).
- `tests/cave-sync.test.ts` : la migration one-shot ne touche plus `stock_overrides` dans le callback, met le stock en file, ne le marque pas terminé si le cloud échoue.
- `tests/api-reset-user.test.ts` : `stock_overrides` vidée en premier, arrêt sur erreur.
- Migration rejouée sur un Postgres local (rôles Supabase simulés) : RLS, upsert, trigger dernier écrit gagne, idempotence.

## Risques

- Horloge d'un appareil très décalée : ses écritures gagnent (ou perdent) à tort. Accepté.
- Modifications hors ligne sur un appareil B antérieures à un import/reset fait sur A : renvoyées par B à sa reconnexion. Rare, accepté.
- Premier chargement sur un nouvel appareil : quantités de base affichées une fraction de seconde avant la lecture cloud.
