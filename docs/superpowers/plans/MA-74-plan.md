# MA-74 — Plan technique : unifier la source d'apogee entre carte/liste/dashboard et fiche detail

## Decision produit (actee par Antoine, 16/07/2026)
**Option A — Coherence totale.** La carte du dashboard (et la liste, et les widgets dashboard) doivent afficher la MEME fenetre d'apogee et le MEME badge que la fiche detail : fenetre IA (`wine_enrichments`) si elle existe, sinon repli heuristique.

## Diagnostic (verifie sur `develop`)
- `lib/apogee-unified.ts::getUnifiedApogee(wine, enrichment?)` est deja la source unique (MA-97). Avec `enrichment` (type `WineEnrichment` de `lib/types`, champs `apogee_start`/`apogee_end`) -> fenetre IA, `estimated=false`. Sans -> repli heuristique, `estimated=true`.
- `components/cave/wine-detail-sheet.tsx:123` appelle `getUnifiedApogee(wine, enrichment)` avec l'enrichissement Supabase charge par `useWineEnrichment(wineId)`. CORRECT.
- `components/cave/wine-card.tsx:107`, `components/cave/cave-list.tsx:40/46/61/62`, `components/cave/dashboard.tsx:62/271` appellent `getUnifiedApogee(wine)` SANS enrichissement -> repli heuristique systematique. C'est la divergence.
- La carte utilise `useWineEnrichmentLegacy()` (cache localStorage, forme legacy `apogee:{debut,fin}`) — inadaptee a `getUnifiedApogee` et non alignee sur la table Supabase lue par la fiche. Ne pas s'appuyer dessus pour l'apogee.

## Approche
Fournir aux conteneurs de liste l'enrichissement Supabase, en UN SEUL fetch groupe (pas de N+1), et le propager a `getUnifiedApogee` + a `WineCard`.
`Dashboard` et `CaveList` recoivent tous deux la liste de vins en prop (`cave: Wine[]`). Point d'injection propre, SANS toucher `app/page.tsx` (fichier interdit).

## Fichiers a modifier / creer

### 1. `hooks/use-wine-enrichment.ts` — nouveau hook batch
Ajouter `useWineEnrichmentsBatch(wineIds: string[]): { map: Map<string, WineEnrichment>; isLoading: boolean }`.
- Un seul appel : `supabase.from("wine_enrichments").select("*").in("wine_id", missingIds).eq("user_id", user.id)`.
- Reutiliser le `enrichmentCache` (Map module deja present) : ne requeter que les `wine_id` absents du cache ; peupler le cache avec les resultats (la fiche detail en beneficie ensuite -> 0 requete).
- Ignorer les ids vides/undefined. Si `!user` ou `wineIds` vide -> map vide, `isLoading=false`.
- Stabiliser la cle de deps (ex. ids tries joins) pour eviter les refetch en boucle.

### 2. `components/cave/wine-card.tsx`
- `WineCardProps` : ajouter `dbEnrichment?: WineEnrichment | null` (import type depuis `@/lib/types`).
- Ligne 107 : `const unifiedApogee = getUnifiedApogee(wine, dbEnrichment ?? null)`.
- NE PAS renommer/supprimer le `enrichment` legacy existant (web_score/source/summary lignes 92-94) : hors perimetre.

### 3. `components/cave/cave-list.tsx`
- Construire `ids = filtered.map(w => w.id).filter(Boolean)`, appeler `useWineEnrichmentsBatch(ids)`.
- `getUnifiedApogee(wine)` (l.40/46) -> `getUnifiedApogee(wine, map.get(wine.id))`.
- `compareApogee(a,b,dir)` (l.59-62) : passer la map pour trier sur la fenetre unifiee reelle (signature etendue ou closure).
- `<WineCard ... dbEnrichment={map.get(wine.id)} />` (l.328 et l.376 archives).

### 4. `components/cave/dashboard.tsx`
- `ids` depuis `cave` (au moins les vins rendus : `stats.toDrink` + `stats.recent`, ou toute la cave active), `useWineEnrichmentsBatch(ids)`.
- `getUnifiedApogee(w)` (l.62 filtre "a boire") et (l.271 rendu) -> passer `map.get(w.id)`.
- `<WineCard ... dbEnrichment={map.get(wine.id)} />` la ou la carte est rendue.

### 5. Test de non-regression — `test` (vitest), PAS e2e
Creer `lib/apogee-unified.test.ts` (ou etendre l'existant) :
- Parite carte/fiche : pour un `wine` + `enrichment` avec `apogee_start/end`, `getUnifiedApogee(wine, enrichment)` retourne `{start,end}` = fenetre IA et `estimated=false` (differente de l'heuristique).
- Fallback inchange : `getUnifiedApogee(wine)` sans enrichment et `getUnifiedApogee(wine, {..., apogee_start:null, apogee_end:null})` retournent la MEME fenetre heuristique (`estimated=true`).
- Semantique legacy preservee (lecon MA-97) : `unifiedToLegacySt` restitue toujours `wait|ok|late|urgent` sur les 4 cas — verifier qu'aucun etat n'est perdu pour les vins NON enrichis (cas dominant).

## Migrations Supabase / env
Aucune. Lecture seule sur table existante `wine_enrichments`. Aucune variable d'env nouvelle.

## Risques de regression
- Scoring suggestions / widget "A boire" (lecon MA-97) : le tri et le filtre "a boire" du dashboard basculent de heuristique->IA pour les vins enrichis. C'est VOULU (coherence), mais verifier que les vins NON enrichis gardent un comportement identique bit-a-bit. Les tests du point 5 couvrent ca.
- Perf dashboard : garantir UN `.in()` par conteneur, pas par carte. Mesurer/relire la query. Pas de N+1.
- wine.id manquant (vins Excel non persistes) : pas de cle -> repli heuristique, comportement inchange (identique a la fiche pour ces vins).
- RLS : `.eq("user_id", user.id)` obligatoire, coherent avec `useWineEnrichment`.

## Garde-fous CLAUDE.md a respecter
- Double quotes uniquement (iOS Safari). TypeScript strict.
- `sanitizeWineName()` inchange (deja en place). Pas de nouveau header/footer -> pas de safe-area concerne.
- NE PAS toucher `app/page.tsx`, `auth-provider.tsx`, `use-auth.ts`, `use-stock-overrides.ts`.
- Gate avant push : `pnpm tsc --noEmit` + `pnpm lint` verts. `pnpm test` vert (nouveau test inclus).

## Ordre d'implementation
1. Hook `useWineEnrichmentsBatch` + test unitaire (rouge -> vert).
2. `wine-card.tsx` (prop `dbEnrichment`).
3. `cave-list.tsx` (batch + compareApogee + prop).
4. `dashboard.tsx` (batch + widgets).
5. `pnpm tsc --noEmit` + `pnpm lint` + `pnpm test`.

## Branche / PR
- Branche : `fix/apogee-source-coherence` (depuis `develop`).
- PR vers `develop`. Titre = titre du ticket. Description = lien Linear MA-74 + resume + AC.
- Commit type : `fix(apogee): unifier la source d'apogee entre carte et fiche detail`.

## Playwright
Non applicable de facon fiable : l'app exige une session Supabase + un vin enrichi seede (lecons MA-100). Couverture assuree par le test unitaire de parite (point 5). Ne pas bloquer sur un e2e authentifie.
