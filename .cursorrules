# CLAUDE.md — Ma Cave à Vins

> Fichier de contexte pour Claude Code et Codex. Toujours synchronisé avec `.cursorrules`.
> Dernière mise à jour : 13 avril 2026

---

## Stack technique

| Élément | Valeur |
|---|---|
| Framework | Next.js App Router |
| UI | shadcn/ui + Tailwind CSS |
| Langage | TypeScript strict |
| Package manager | pnpm — toujours sync pnpm-lock.yaml |
| Déploiement | Vercel — auto sur push main |
| Base de données | Supabase (chriywwlnihmclbrjmta.supabase.co) |
| Auth | Supabase Auth — email + Apple + Google |
| Tracking produit | Linear (linear.app/ma-cave-a-vin) |
| Future | Expo / React Native (Phase 5) |

---

## Règles NON-NÉGOCIABLES

Ces règles s'appliquent à chaque ligne de code produite. Aucune exception.

- **Double quotes uniquement** — `'text'` provoque un bug Safari iOS → toujours `"text"`
- **sanitizeWineName() obligatoire** — sur tous les noms de vins affichés (`lib/wine-helpers.ts`)
- **Safe Area iOS** — `env(safe-area-inset-top/bottom)` sur tous les headers/footers
- **Bottom sheets** — `max-h-[90dvh] flex flex-col` + `overflow-y-auto flex-1` + `z-[60]` minimum
- **WineExpertPanel** — doit toujours recevoir `wineName` en prop
- **Pas de swipe iOS** — abandonné définitivement — menu 3 points uniquement
- **Couleurs** — jamais de hex hardcodé (#722F37) — utiliser `bg-cave-bordeaux` etc.
- **TypeScript strict** — pas de `any`, pas de `@ts-ignore`
- **Branches GitHub** — uniquement `claude/nom-feature` — jamais push direct sur `develop` ou `main`
- **isPremium** — toujours lire depuis `use-auth.ts`, ne jamais dupliquer la logique

---

## Flux de travail obligatoire

```
Analyse → Proposition → Validation Antoine ✋ → Code → Push claude/* → PR develop → test iPhone → PR develop→main
```

Chaque PR cible `develop`. Jamais `main` directement.

---

## Architecture codebase

```
app/page.tsx                  → Fusion cave Excel + vins manuels (SEUL point)
app/layout.tsx                → Root layout + AuthProvider (initialUser server-side)
app/auth/callback/            → Callback OAuth Supabase
app/api/scan-label/           → Endpoint Claude Vision
app/api/enrich-wine/          → Endpoint enrichissement IA (schéma complet Sprint 3.5)

components/cave/
  app-shell.tsx               → Shell principal, safe-area fallback
  auth-sheet.tsx              → Apple + Google Sign In
  scan-label-sheet.tsx        → z-[60], scroll OK
  wine-card.tsx               → Menu 3 points, JAMAIS swipe
  wine-expert-panel.tsx       → wineName prop OBLIGATOIRE
  wine-detail-sheet.tsx       → Fiche détail — sections enrichies Sprint 3.5
  dashboard.tsx               → Attention imports Camera après refacto
  taste-profile-bars.tsx      → Profil dégustation (Sprint 3.5 — gratuit)

hooks/
  use-auth.ts                 → useAuth + isPremium + rawPlan + role
  use-cave-sync.ts            → Migration localStorage → Supabase
  use-caves.ts                → Multi-cave — NE PAS instancier dans chaque WineCardActions
  use-stock-overrides.ts      → Stock — clé getWineIdentityKey() uniquement

lib/
  feature-flags.ts            → SCAN_LABEL=enabled, ENRICH_WINE=enabled
  wine-helpers.ts             → sanitizeWineName() OBLIGATOIRE
  supabase/                   → client.ts, server.ts, middleware.ts

tests/
  stock-overrides.test.ts     → 3 tests (identité stock)
  wine-sync.test.ts           → 4 tests (merge sync)
  api-scan-label.test.ts      → 2 tests
  api-enrich-wine.test.ts     → 2 tests
```

---

## Branches permanentes

| Branche | Rôle | Vercel |
|---|---|---|
| `main` | Production stable | v0-ma-cave-a-vins.vercel.app |
| `develop` | Staging — tests iPhone | URL Preview (bookmarker sur iPhone) |
| `develop-sprint-3-work` | Sauvegarde travail UX — NE PAS merger sans inspection | — |

---

## Pièges critiques

- **pnpm-lock.yaml** : `pnpm install --no-frozen-lockfile` après tout `pnpm add` — cause #1 de build failures
- **Env Vercel** : case-sensitive, modifier uniquement via le dashboard
- **Imports lucide-react** : vérifier Camera après tout refactoring de dashboard.tsx
- **app/page.tsx** : SEUL point de fusion Excel + vins manuels — ne pas dupliquer
- **develop-sprint-3-work** : contient du code UX non intégré — cherry-pick uniquement après inspection
- **useCaves()** : NE PAS instancier dans chaque WineCardActions (N+1) — remonter au niveau shell

---

## Schéma Supabase — tables principales

```
wines               → vins de l'utilisateur
caves               → caves (multi-cave)
profiles            → profil + plan (free/amateur/collector)
stock_overrides     → surcharges de stock
wine_enrichments    → cache enrichissement IA (Sprint 3.5)
```

RLS obligatoire sur toutes les tables : `user_id = auth.uid()`

---

## Plan freemium

```
isPremium = plan === 'premium' || role === 'beta' || role === 'admin'
```

| Feature | Gratuit | Collectionneur (3,49€/mois) |
|---|---|---|
| Cave | 20 vins max | Illimitée |
| Scan étiquette IA | 3/mois | Illimité |
| Enrichissement IA | ❌ | ✅ |
| Multi-cave | ❌ | ✅ |
| Export cave | ❌ | ✅ |
| Profil dégustation | ✅ (statique) | ✅ (IA précis) |

---

## Commandes utiles

```bash
pnpm dev
pnpm build
pnpm install --no-frozen-lockfile   # après pnpm add
pnpm exec tsc --noEmit              # typecheck
pnpm exec vitest run                # tests (11 passent)
```

---

## IDs clés

| Ressource | Valeur |
|---|---|
| GitHub | antoinerivaud1/v0-ma-cave-a-vins |
| Vercel project | prj_rnbCuyK7DTuLbC8bfur8ChwyFgtd |
| Vercel team | team_FgcRiCPgsJtFfNccJM50aWnT |
| Supabase | chriywwlnihmclbrjmta.supabase.co |
| Linear | linear.app/ma-cave-a-vin |

---

## Checklist avant chaque push

- [ ] `pnpm build` passe sans erreur
- [ ] `pnpm exec tsc --noEmit` propre
- [ ] Double quotes partout
- [ ] `sanitizeWineName()` sur tous les noms de vins
- [ ] `safe-area-inset` sur les nouveaux headers/footers
- [ ] Pas de `console.log` oublié
- [ ] PR cible `develop` (vérifier visuellement sur GitHub)
- [ ] Si CLAUDE.md modifié → `cp CLAUDE.md .cursorrules` dans le même commit
