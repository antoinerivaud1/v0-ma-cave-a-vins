# Ma Cave à Vins — Instructions Claude Code

> Lis ce fichier en entier avant toute action. Ce sont les règles non-négociables du projet.

---

## 1. Contexte produit

**Ma Cave à Vins** est une web app (cible finale : app mobile native) de gestion de cave personnelle.
- Cible : amateurs éclairés de vins français (CSP+), téléphone en main devant leur cave physique
- Positionnement : extension de mémoire, pas une app de découverte ni un réseau social
- Scan étiquette via Claude Vision (Anthropic) — différenciateur clé, pas de base de données externe
- Freemium : 20 vins gratuit, illimité premium (prix non encore défini)

---

## 2. Stack technique

| Élément | Valeur |
|---|---|
| Framework | Next.js App Router (jamais Pages Router) |
| UI | shadcn/ui + Tailwind CSS |
| Langage | TypeScript strict |
| Package manager | **pnpm** — toujours synchroniser pnpm-lock.yaml |
| Déploiement | Vercel — auto-deploy sur push main |
| Repo | antoinerivaud1/v0-ma-cave-a-vins |
| Base de données | Supabase (https://chriywwlnihmclbrjmta.supabase.co) |
| Auth | Supabase Auth |

---

## 3. Flux de travail obligatoire

```
Analyse → Proposition → Validation Antoine → Code
```

**Ne jamais écrire une ligne de code sans validation explicite d'Antoine.**

---

## 4. Règles de code non-négociables

### Interdits absolus
- ❌ Jamais de **single quotes** dans le code — iOS Safari les convertit en guillemets typographiques
- ❌ Jamais de **swipe iOS** — abandonné définitivement (bugs Safari). Menu 3 points uniquement.
- ❌ Pas de refonte architecturale non sollicitée
- ❌ Pas de feature en avance de phase sans le signaler
- ❌ Jamais de base de données externe de vins

### Obligations
- ✅ `sanitizeWineName()` obligatoire sur **tous** les affichages de noms de vins
- ✅ `env(safe-area-inset-top/bottom)` sur **tous** les headers et footers iOS
- ✅ Fallback `safe-area-inset-bottom = 20px` dans `app-shell.tsx`
- ✅ `WineExpertPanel` doit toujours recevoir `wineName` en prop
- ✅ Vérifier les imports `lucide-react` après toute refacto de `dashboard.tsx` (Camera disparaît)
- ✅ Double quotes partout dans le JSX

---

## 5. Architecture des données

- **Source de vérité authentifié** : Supabase
- **Cache offline / non-auth** : localStorage (à conserver)
- **Migration** : one-shot au premier login via `useCaveSync`
- **Point de fusion unique** : `app/page.tsx` est le SEUL endroit qui fusionne Excel + vins manuels — ne jamais dupliquer cette logique

---

## 6. Pièges build Vercel

- **Cause #1 d'échec** : `pnpm-lock.yaml` désynchronisé
- Après tout ajout dans `package.json` : exécuter `pnpm install --no-frozen-lockfile` en local, puis push
- Vercel MCP ne permet pas de modifier les variables d'env — passer par le dashboard Vercel

---

## 7. Fichiers critiques

```
app/
  page.tsx                    → fusion cave Excel + vins manuels (SEUL point)
  layout.tsx                  → metadata + PWA config
  auth/callback/route.ts      → callback OAuth Supabase
  api/scan-label/route.ts     → endpoint Claude Vision

components/cave/
  app-shell.tsx               → shell principal, safe-area fallback 20px
  auth-sheet.tsx              → Apple + Google Sign In ⚠️ (bug Google actif)
  wine-card.tsx               → menu 3 points, JAMAIS swipe
  wine-expert-panel.tsx       → exige wineName en prop OBLIGATOIREMENT
  dashboard.tsx               → attention imports Camera après toute refacto

hooks/
  use-auth.ts                 → useAuth + isPremium
  use-cave-sync.ts            → migration localStorage → Supabase
  use-manual-wines.ts         → localStorage cave-manual-wines
  use-stock-overrides.ts      → localStorage cave-stock-overrides
  use-user-profile.ts         → localStorage cave-user-profile

lib/
  feature-flags.ts            → SCAN_LABEL=enabled, ENRICHISSEMENT_WEB=enabled
```

---

## 8. Auth — règles de sécurité

- **Apple Sign In** ✅ fonctionnel — **NE PAS TOUCHER** sans raison explicite, risque de régression
- **Google Sign In** ⚠️ bug actif en prod — en cours d'investigation
- `isPremium` est centralisé dans `useAuth` — ne pas le recalculer ailleurs
- `role = 'beta'` → `isPremium = true` (accès complet pour testeurs)

---

## 9. Bugs résolus — ne pas régresser

| Bug | Résolution |
|---|---|
| Swipe iOS Safari | Swipe abandonné → menu 3 points. Double quotes partout. |
| "Acheter en ligne" → "Vin inconnu" | `wineName` manquait dans `WineExpertPanel` |
| Build Vercel échoue | `pnpm-lock.yaml` désynchronisé |
| Safe area iOS | `env(safe-area-inset-top)` sur tous les headers |
| Marge bas premier rendu | Fallback 20px dans `app-shell.tsx` |
| Camera retiré par erreur | Vérifier imports `lucide-react` après refacto `dashboard.tsx` |
| Scan badge "Bientôt" après merge | Flag `SCAN_LABEL` resté `coming-soon` → mis à `enabled` |

---

## 10. Modèle freemium (Supabase profiles)

```sql
plan        TEXT DEFAULT 'free'    -- 'free' | 'premium'
role        TEXT DEFAULT 'user'    -- 'user' | 'beta' | 'admin'
scan_count  INT  DEFAULT 0
reset_at    TIMESTAMPTZ
```

Paiement via **RevenueCat** (décision prise, intégration non démarrée).

---

## 11. Communication

- Toujours en **français**
- Une tâche à la fois — ne pas proposer la suite avant validation
- Demande floue = une seule question ciblée avant d'avancer
- En fin de session : mettre à jour le document Notion de passation

---

*Basé sur le document de passation Notion — 20 mars 2026*
