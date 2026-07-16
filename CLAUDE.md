# CLAUDE.md — Ma Cave à Vins

> Fichier de contexte pour Claude Code et Codex. Toujours synchronisé avec `.cursorrules`.
> Dernière mise à jour : 18 avril 2026

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
- **Apogée : source unique** — `getUnifiedApogee(wine, enrichment)` de `lib/apogee-unified.ts`, en passant l'enrichissement Supabase (`useWineEnrichment` / `useWineEnrichmentsBatch`). Jamais `getApogee()` en direct dans un composant, jamais d'appel sans enrichissement quand le vin a un `id` (MA-74)

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
- **Pause Supabase** : plan gratuit, projet INACTIVE après ~1 semaine d'inactivité → app KO (erreur 521). Restaurer via MCP Supabase (`restore_project`, ~2-3 min) avant toute session de test
- **Tests unitaires** : dans `tests/` UNIQUEMENT (vitest `include: tests/**/*.test.ts`) — un test colocalisé dans `lib/` n'est jamais exécuté
- **Preview Vercel protégée** : l'URL brute renvoie un mur d'auth Vercel — générer un lien `_vercel_share` pour toute validation manuelle

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

## Pattern auth Supabase — obligatoire

Ne jamais court-circuiter avec `if (!userId) return []` sans vérifier que `loading` est false.

Pattern correct :
```typescript
const { user, loading } = useAuth()
if (loading) return <Skeleton />
if (!user) return null
// suite du composant
```

Pattern incorrect (provoque des bugs de race condition) :
```typescript
const { user } = useAuth()
if (!user) return [] // FAUX — loading non vérifié
```

---

## Plan freemium — 3 tiers

```
isPremium = plan === 'premium' || role === 'beta' || role === 'admin'
```

| Feature | Gratuit | Amateur 3,49€/mois | Collectionneur 6,99€/mois |
|---|---|---|---|
| Bouteilles | 50 max | Illimité | Illimité |
| Caves | 1 | 1 | Multi-cave |
| Scan IA | ❌ | ✅ | ✅ |
| Enrichissement IA | ❌ | ✅ | ✅ |
| Profil dégustation | ✅ (statique) | ✅ (IA) | ✅ (IA précis) |
| Fiche vin enrichie complète | ❌ | ❌ | ✅ |
| Export CSV | ❌ | ✅ | ✅ |
| Export PDF + stats avancées | ❌ | ❌ | ✅ |

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

---

## Évolution des skills et capitalisation

### Principe
Les skills (`/mnt/skills/user/`) sont des documents vivants.
Ils doivent évoluer après chaque session où un apprentissage significatif a eu lieu.
Un skill qui ne s'améliore pas est un skill qui sera contourné.

### Quand mettre à jour un skill

| Événement | Skill à mettre à jour |
|---|---|
| Bug résolu après investigation | `debug` — ajouter le pattern et la règle absolue |
| Nouvelle convention de code établie | `dev-code-prompt` — contraintes NON-NÉGOCIABLES |
| Nouvelle règle iOS / Tailwind / Supabase | `dev-code-prompt` + `CLAUDE.md` |
| Workflow de session amélioré | `start` ou `end` |
| Nouveau type de PR ou conflit résolu | `deploy` |

### Qui met à jour les skills
Claude met à jour les skills en fin de session (via le skill `end`).
Antoine valide et installe les fichiers dans `/mnt/skills/user/[skill]/SKILL.md`.

### Format de versioning
- `+0.0.1` : ajout d'un pattern ou correction mineure
- `+0.1.0` : nouvelle règle absolue issue d'une expérience terrain
- `+1.0.0` : restructuration majeure

---

## Règles capitalisées — expérience terrain

Ces règles complètent les NON-NÉGOCIABLES. Elles ont été apprises en production.

**[2026-04-18] Initialisation de store React partagé :**
Tout store partagé entre N composants (useSyncExternalStore) doit être initialisé
au niveau module, pas dans un useEffect. Un useEffect d'initialisation appelé par
N composants crée une race condition si tous montent dans le même tick React.
Fichier concerné : `hooks/use-stock-overrides.ts`.

**[2026-04-18] Rebases et conflits de merge :**
Ne jamais utiliser `git rebase` pour résoudre un conflit de merge sur une PR.
Ouvrir une nouvelle branche propre depuis develop et y réécrire le fix.
Un rebase mal exécuté peut produire une PR avec 0 commits et se fermer automatiquement.

**[2026-04-18] Validation fonctionnelle vs typecheck :**
`pnpm tsc --noEmit` valide les types mais pas le comportement runtime.
Tout fix de bug doit être validé sur le preview Vercel avec un test
utilisateur concret (cliquer le bouton, observer le résultat) avant merge.

**[2026-04-18] Nommage des branches de bug :**
Les branches de fix doivent nommer la CAUSE, pas le symptôme.
OK : `fix/emitchange-race-condition-mount`
KO : `fix/freeze-bouton-consommer`
