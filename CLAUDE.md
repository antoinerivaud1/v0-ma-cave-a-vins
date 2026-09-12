# CLAUDE.md : Ma Cave à Vins

> Source unique de vérité pour tout agent (Claude Code, Cowork, Cursor).
> `.cursorrules` est une copie : `cp CLAUDE.md .cursorrules` dans le même commit.
> Dernière mise à jour : 12 septembre 2026 (audit de reprise, MA-85)

---

## Produit en une ligne

App web mobile-first de gestion de cave à vin, freemium (Gratuit / Amateur / Collectionneur), avec scan d'étiquette et enrichissement IA. Solo dev : Antoine. Cible finale : App Store + Google Play via Expo (Phase 5).

---

## Stack technique

| Élément | Valeur |
|---|---|
| Framework | Next.js 16 App Router (Turbopack), React 19 |
| UI | shadcn/ui + Radix + Tailwind CSS 4, design system **Synthèse v1** (juin 2026) |
| Langage | TypeScript strict (`tsconfig.json`), pas de `any`, pas de `@ts-ignore` |
| Package manager | pnpm 10 (`pnpm-workspace.yaml` syntaxe v10), lockfile toujours commité |
| Base de données | Supabase `chriywwlnihmclbrjmta` (eu-central-1), Postgres 17, RLS partout |
| Auth | Supabase Auth : email + Apple + Google (`components/cave/auth-provider.tsx`, `hooks/use-auth.ts`) |
| IA | Anthropic SDK : Claude Vision (`/api/scan-label`), enrichissement avec `web_search` natif (`/api/enrich-wine`) |
| Déploiement | Vercel : `main` → prod, `develop` → preview staging, chaque branche → preview |
| Tests | Vitest 4 (`tests/*.test.ts`, 35 tests) + Playwright (`tests/e2e/`, 2 specs) |
| Tracking | Linear (linear.app/ma-cave-a-vin), 100 % des tickets. Notion : roadmap/business uniquement |

---

## Règles NON-NÉGOCIABLES

Chaque ligne de code produite. Aucune exception.

- **Double quotes uniquement** : `'text'` provoque un bug Safari iOS. Règle ESLint `quotes: double` active.
- **`sanitizeWineName()`** (`lib/wine-helpers.ts`) sur tout nom de vin affiché.
- **Safe area iOS** : `env(safe-area-inset-top/bottom)` sur tout header / footer / bottom nav.
- **Bottom sheets** : `max-h-[90dvh] flex flex-col` + contenu `overflow-y-auto flex-1` + `z-[60]` minimum. Un composant overlay ouvert depuis un sheet se rend **à l'intérieur** de `<SheetContent>` (sinon Radix le traite comme un tap « outside » et ferme le sheet).
- **Pas de swipe iOS** : menu 3 points uniquement.
- **Couleurs** : jamais de hex hardcodé. Tokens Synthèse v1 uniquement (`ink`, `rouge`, `gold`, `cream`, surfaces par type de vin). Les alias `cave-*` ont été supprimés (MA-99).
- **Thème** : light uniquement. Le dark mode a été retiré (MA-94), ne pas le réintroduire.
- **`isPremium`** : toujours depuis `useAuth()` (`rawPlan === "amateur" | "collector"` ou `role === "admin" | "beta"`). Jamais `plan === "premium"` : cette valeur n'existe pas.
- **Apogée : source unique** `getUnifiedApogee(wine, enrichment)` de `lib/apogee-unified.ts`, en passant l'enrichissement Supabase (`useWineEnrichment` / `useWineEnrichmentsBatch`). Jamais `getApogee()` direct dans un composant (MA-74).
- **Appels IA séquentiels** : jamais de `Promise.all` sur `/api/enrich-wine` (rate limit Anthropic + `api_rate_limits`).
- **Fichiers interdits sans `[OVERRIDE]` explicite dans le titre de PR** : `components/cave/auth-provider.tsx`, `hooks/use-auth.ts`, `hooks/use-stock-overrides.ts`, `app/page.tsx`.
- **Branches** : `claude/<type>-<slug>` ou `<type>/<ticket>-<slug>`. PR vers `develop` uniquement. Jamais de push direct sur `develop` ou `main`. `main` reçoit uniquement des PR `develop → main` après tests iPhone.
- **Tests unitaires dans `tests/` uniquement** (vitest `include: tests/**/*.test.ts`). Un test colocalisé n'est jamais exécuté.
- **Pas de `console.log`** en prod (`console.error` toléré dans les catch).

---

## Flux de travail

```
Ticket Linear cadré → branche → code → pnpm check (typecheck + lint + test + build)
→ push → PR develop → preview Vercel (lien _vercel_share) → test iPhone par Antoine
→ merge develop → (batch) PR develop → main
```

Un seul checkpoint humain : la validation avant merge. Aucun merge sans décision explicite d'Antoine.

Commandes :

```bash
pnpm dev
pnpm typecheck                  # tsc --noEmit
pnpm lint                       # eslint .
pnpm test                       # vitest run (35 tests)
pnpm build
pnpm check                      # les 4 d'affilée, à lancer avant tout push
pnpm test:e2e                   # Playwright, cf. docs/testing-e2e.md
pnpm install --no-frozen-lockfile   # après tout pnpm add, puis commit du lockfile
```

---

## Architecture

```
app/
  layout.tsx                → Root layout + AuthProvider (initialUser server-side)
  page.tsx                  → SEUL point de fusion cave Excel + vins manuels
  auth/callback/            → Callback OAuth Supabase
  confidentialite/          → Politique de confidentialité
  api/scan-label/           → Claude Vision, gate plan Amateur+, rate limit
  api/enrich-wine/          → Enrichissement IA + web_search, gate plan Amateur+, rate limit, cache wine_enrichments
  api/reset-user/           → Reset complet (stock_overrides → tastings → wines → caves)
  api/auth/signout/
proxy.ts                    → Middleware Supabase SSR (refresh session)

components/cave/
  app-shell.tsx             → Shell, bottom nav 5 onglets, safe-area, cave active dans le header
  dashboard.tsx, cave-list.tsx, wine-card.tsx, wine-card-actions.tsx (menu 3 points)
  wine-detail-sheet.tsx     → Fiche détail, sections enrichies, bouton « Relancer l'analyse » (MA-102)
  wine-enrichment-panel.tsx → Panneau enrichissement IA
  add-wine-sheet.tsx, scan-label-sheet.tsx, wine-search-sheet.tsx, wine-move-sheet.tsx
  cave-manager-sheet.tsx, cave-switch-sheet.tsx (multi-cave)
  tasting-screen.tsx, tasting-card.tsx, tasting-sheet.tsx, tasting-panel.tsx (Carnet de dégustation)
  suggest.tsx, suggestion-card.tsx (Accords)
  settings.tsx, auth-sheet.tsx, paywall-sheet.tsx (FOMO, MA-89), onboarding.tsx
  synthese/                 → Primitives design system : big-tile, stat-pill, filter-pill, stars, watermark, cycle-chart, apogee-bar

hooks/
  use-auth.ts               → useAuth(), isPremium, rawPlan, role
  use-cloud-cave.ts         → Lecture/écriture vins Supabase
  use-cave-sync.ts          → Migration one-shot localStorage → Supabase au SIGNED_IN
  use-caves.ts              → Multi-cave. Instancier UNE fois au niveau shell (N+1 sinon)
  use-stock-overrides.ts    → Stock (consommation/archivage). localStorage, clé getWineIdentityKey(). Voir MA-113
  use-wine-enrichment.ts    → useWineEnrichment + useWineEnrichmentsBatch (1 requête .in())
  use-tastings.ts, use-user-profile.ts, use-manual-wines.ts, use-file-parser.ts

lib/
  apogee-unified.ts         → getUnifiedApogee (IA prioritaire, fallback heuristique « estimé »)
  wine-helpers.ts           → sanitizeWineName()
  stock-overrides.ts        → getWineIdentityKey()
  rate-limit.ts             → checkRateLimit (table api_rate_limits, fonction increment_rate_limit)
  feature-flags.ts          → SCAN_LABEL, ENRICH_WINE (enabled)
  supabase/client.ts, server.ts
  suggest-service.ts        → factice, à retirer ou implémenter (MA-46)

data/                       → accords, apogee (heuristique), regions (worldwide), experts, wine-tips
supabase/migrations/        → référence versionnée du schéma prod (voir README.md du dossier)
tests/                      → stock-overrides, wine-sync, apogee-unified, api-scan-label, api-enrich-wine + e2e/
docs/superpowers/           → specs Synthèse v1, plans par ticket, pipeline-lessons.md
```

---

## Schéma Supabase (prod, 12/09/2026)

| Table | Rôle | Notes |
|---|---|---|
| `profiles` | plan (`free`/`amateur`/`collector`), role (`user`/`beta`/`admin`), scan_count_month, last_active_cave_id | enums `user_plan`, `user_role` |
| `caves` | multi-cave | |
| `wines` | vins de l'utilisateur | `wine_type`, `classification`, apogée, `enriched_at` |
| `wine_enrichments` | cache enrichissement IA | unique `(wine_id, user_id)`, `apogee_status` |
| `tastings` | Carnet de dégustation | `stars` 1-5, `cave_wine_ref` |
| `stock_overrides` | surcharges de stock | colonnes `wine_identity_key`, `stock`. **Non alimentée** (MA-113) |
| `api_rate_limits` | rate limiting par user/route/fenêtre | écriture via `increment_rate_limit` SECURITY DEFINER |

RLS sur toutes les tables : `user_id = auth.uid()`. Les FK vers `auth.users` sont vérifiées même dans les fonctions SECURITY DEFINER : les UUID de test doivent être de vrais users.

Admin : Antoine, role `admin`, bypass de tous les gates.

---

## Plan freemium

| Feature | Gratuit | Amateur 3,49 €/mois ou 29,99 €/an | Collectionneur 6,99 €/mois ou 59,99 €/an |
|---|---|---|---|
| Bouteilles | 50 max | Illimité | Illimité |
| Caves | 1 | 1 | Multi-cave |
| Scan IA | ❌ (PaywallSheet) | ✅ | ✅ |
| Enrichissement IA | ❌ | ✅ | ✅ |
| Fiche vin enrichie complète | ❌ | ❌ | ✅ |
| Export CSV | ❌ | ✅ | ✅ |
| Export PDF, stats avancées, valorisation | ❌ | ❌ | ✅ |

Principe FOMO : les features gatées restent visibles et ouvrent `PaywallSheet`, on ne les cache pas. Paiement (RevenueCat) : Phase 4, pas encore branché ; le plan est modifié à la main dans `profiles`.

---

## Pattern auth (race condition)

```typescript
const { user, loading } = useAuth()
if (loading) return <Skeleton />
if (!user) return null
```

Jamais `if (!user) return []` sans vérifier `loading`.

---

## Pièges connus

- **Supabase en pause** : plan gratuit, projet `INACTIVE` après ~1 semaine sans trafic → app KO (erreur 521, « serveur introuvable »). Réflexe : `get_project` puis `restore_project` (2-3 min) **avant** toute session de test.
- **Preview Vercel protégée** : l'URL brute affiche un mur d'auth Vercel. Générer un lien `_vercel_share` (`get_access_to_vercel_url`, valable ~23 h).
- **`list_deployments` Vercel** : `projectId` et `teamId` obligatoires ensemble ; le suffixe des URL de branche est imprévisible, toujours relire après push.
- **Migrations Supabase** : appliquées via SQL Editor/MCP, l'historique prod ne porte pas les noms des fichiers du repo. Tout changement de schéma = fichier idempotent dans `supabase/migrations/` dans la même PR.
- **Tickets anciens** : re-valider le diagnostic contre le code actuel avant de planifier (la refonte Synthèse v1 a changé le fond de plusieurs bugs).
- **Rebase** : jamais pour résoudre un conflit de PR. Nouvelle branche propre depuis `develop`.
- **Store partagé (`useSyncExternalStore`)** : initialisation au niveau module, jamais dans un `useEffect` (race au mount de N composants).
- **Deux tentatives de fix échouées** = arrêt et reprise du diagnostic à la racine, pas de troisième essai dans la même direction.
- **Sandbox Cowork** : `npm i -g pnpm@10`, installs en foreground, pas de `nohup`. Playwright : `docs/testing-e2e.md`.

---

## IDs clés

| Ressource | Valeur |
|---|---|
| GitHub | `antoinerivaud1/v0-ma-cave-a-vins` (public) |
| Vercel project / team | `prj_rnbCuyK7DTuLbC8bfur8ChwyFgtd` / `team_FgcRiCPgsJtFfNccJM50aWnT` |
| Preview develop | `v0-ma-cave-a-vins-git-develop-antoinerivaud1-1029s-projects.vercel.app` |
| Supabase | `chriywwlnihmclbrjmta` (ne jamais toucher `drmmgwchoowggpsppilo`, autre projet) |
| Linear | team « Ma cave à vin », projet « Ma Cave à Vins », tickets `MA-n` |

---

## Checklist avant push

- [ ] `pnpm check` vert
- [ ] Double quotes, `sanitizeWineName()`, safe-area, tokens Synthèse v1
- [ ] Aucun fichier interdit touché (ou `[OVERRIDE]` justifié)
- [ ] Lockfile commité si `package.json` a changé
- [ ] Migration versionnée si le schéma a changé
- [ ] PR cible `develop`
- [ ] Si `CLAUDE.md` modifié : `cp CLAUDE.md .cursorrules` dans le même commit
- [ ] Leçon généralisable → `docs/superpowers/pipeline-lessons.md`
