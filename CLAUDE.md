# Ma Cave à Vins — CLAUDE.md

## Stack & Infra
- **Framework :** Next.js App Router, TypeScript strict
- **UI :** shadcn/ui, Tailwind CSS, lucide-react
- **Backend :** Supabase (postgres + RLS)
- **Cache :** localStorage
- **Package manager :** pnpm UNIQUEMENT — jamais npm/yarn
- **Repo :** antoinerivaud1/v0-ma-cave-a-vins
- **Deploy :** Vercel (auto-deploy sur push main et develop)
- **Supabase project :** chriywwlnihmclbrjmta.supabase.co

---

## Workflow Git
- Branches de travail : toujours `claude/*`
- Cible des PR : toujours `develop` (JAMAIS `main` directement)
- `develop` = staging — tester sur device réel via Preview URL Vercel
- `main` = production stable — merge uniquement après validation sur develop
- Pour merger develop → main : ouvrir une PR manuellement sur GitHub

## Environnement de test
- URL prod : https://v0-ma-cave-a-vins.vercel.app (branche main)
- URL staging : Preview Vercel générée automatiquement pour la branche develop
  (récupérer l'URL dans le dashboard Vercel après le premier push)

---

## Règles non-négociables

### Code
- **Jamais de single quotes** dans le code — iOS Safari les convertit en guillemets typographiques. Double quotes partout, y compris dans JSX et les strings CSS-in-JS.
- `sanitizeWineName()` sur TOUS les affichages de noms de vins — import depuis `@/lib/wine-helpers`
- `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` sur tout nouveau header/footer iOS

### UI mobile
- `max-h-[90dvh] flex flex-col` + `overflow-y-auto flex-1` sur tout bottom sheet contenant un formulaire
- `z-[60]` minimum sur tout sheet custom (bottom nav est à z-50)

### Package management
- Si `package.json` modifié : `pnpm install --no-frozen-lockfile` puis push `pnpm-lock.yaml`

---

## Fichiers à ne JAMAIS toucher (sauf demande explicite)
- `components/providers/auth-provider.tsx` — Apple Sign In + Google Sign In
- `hooks/use-auth.ts` — authentification
- `hooks/use-stock-overrides.ts` — gestion stock
- `app/page.tsx` — SEUL point de fusion Excel + vins manuels

---

## Architecture clé

### Points d'entrée
- `app/page.tsx` — page principale, fusion des sources de données
- `components/cave/app-shell.tsx` — shell de navigation, routing entre onglets
- `components/cave/bottom-nav.tsx` — navigation bas de page (4 onglets)

### Wine card
- `components/cave/wine-card.tsx` — carte principale
- `components/cave/wine-card-actions.tsx` — menu 3 points (NE PAS modifier sans raison explicite)
- **Règle critique :** `WineCardActions` doit toujours être EN DEHORS du `<button>` de toggle
- Après toute modif de `wine-card.tsx` : vérifier les imports lucide-react dans `dashboard.tsx` (import Camera !)

### Enrichissement
- `app/api/enrich-wine/route.ts` — enrichissement IA des vins
- `components/cave/wine-enrichment-panel.tsx` — panel d'affichage enrichissement

---

## Conventions de fichiers
- Plans de sprint : `docs/superpowers/plans/`
- Specs de design : `docs/superpowers/specs/`
- Migrations Supabase : `supabase/migrations/`
- Hooks : `hooks/`
- Composants cave : `components/cave/`
- Feature flags : `lib/feature-flags.ts`
