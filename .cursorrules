# Ma Cave à Vins — CLAUDE.md

> Référence absolue pour tous les agents IA travaillant sur ce projet.
> Lire intégralement avant toute action.

---

## 🏗 Stack technique

- Framework : Next.js App Router
- UI : shadcn/ui + Tailwind CSS
- Langage : TypeScript strict
- Package manager : pnpm (toujours synchroniser pnpm-lock.yaml)
- Déploiement : Vercel (auto sur push)
- Base de données : Supabase (chriywwlnihmclbrjmta.supabase.co)
- Auth : Supabase Auth — email + Apple + Google

---

## 🌿 Branches Git — Règles absolues

| Branche | Rôle | Déploiement |
|---------|------|-------------|
| `main` | Production stable | v0-ma-cave-a-vins.vercel.app |
| `develop` | Staging — tests iPhone | URL Preview Vercel |
| `claude/*` | Branches de travail agents IA | Preview Vercel auto |

### Règles NON-NÉGOCIABLES

- Les agents IA créent UNIQUEMENT des branches `claude/nom-feature`
- La cible de toute PR est TOUJOURS `develop` — JAMAIS `main`
- Le merge `develop` → `main` est fait MANUELLEMENT par Antoine après test iPhone
- Un seul agent actif à la fois sur une branche
- Force push interdit sur `main` et `develop`

### Créer une branche correctement

```bash
git checkout develop
git pull origin develop
git checkout -b claude/nom-feature
# ... travail ...
git push origin claude/nom-feature
# Ouvrir PR sur GitHub → cible : develop
```

---

## ✅ Checklist obligatoire avant tout push

Vérifier chaque point avant de pousser quoi que ce soit :

- [ ] `pnpm build` passe sans erreur
- [ ] Pas de `console.log` oublié
- [ ] Double quotes partout — jamais de single quotes (bug Safari iOS)
- [ ] `sanitizeWineName()` sur tous les affichages de noms de vins
- [ ] `env(safe-area-inset-top/bottom)` sur tous les nouveaux headers/footers
- [ ] `max-h-[90dvh] flex flex-col` + `overflow-y-auto flex-1` sur les bottom sheets
- [ ] `z-[60]` minimum sur les bottom sheets
- [ ] La PR GitHub cible `develop` (vérifier visuellement avant de cliquer Merge)
- [ ] Aucune régression sur les flux : login → vins affichés → action principale

---

## ⚠️ Conventions NON-NÉGOCIABLES

### Double quotes
```typescript
// ✅ Correct
const label = "Bonjour"
// ❌ Interdit — bug Safari iOS
const label = 'Bonjour'
```

### sanitizeWineName() — obligatoire sur tous les affichages
```typescript
import { sanitizeWineName } from "@/lib/wine-helpers"
// ✅ Toujours
<span>{sanitizeWineName(wine.name)}</span>
// ❌ Jamais
<span>{wine.name}</span>
```

### Safe area iOS — obligatoire sur tous les headers/footers
```typescript
// ✅ Correct
style={{ paddingTop: "env(safe-area-inset-top, 20px)" }}
// ❌ Manquant = contenu sous la barre de statut iOS
```

### Bottom sheets
```typescript
// ✅ Pattern obligatoire
className="max-h-[90dvh] flex flex-col z-[60]"
// Contenu scrollable à l'intérieur :
className="overflow-y-auto flex-1"
```

### Swipe iOS — abandonné définitivement
Ne jamais réintroduire de swipe. Menu 3 points uniquement.

---

## 🏛 Architecture codebase

```
app/
  page.tsx              → SEUL point de fusion vins (ne pas dupliquer)
  layout.tsx            → Root layout + AuthProvider (initialUser server-side)
  auth/callback/        → Callback OAuth Supabase
  api/
    scan-label/         → Endpoint Claude Vision
    enrich-wine/        → Endpoint enrichissement IA (pas de web_search)

components/cave/
  app-shell.tsx         → Shell principal, safe-area fallback 20px
  auth-sheet.tsx        → Apple + Google Sign In
  scan-label-sheet.tsx  → z-[60], scroll OK
  wine-card.tsx         → Menu 3 points, JAMAIS swipe
  wine-expert-panel.tsx → wineName prop OBLIGATOIRE

hooks/
  use-auth.ts           → useAuth() + isPremium
  use-cave-sync.ts      → Migration localStorage → Supabase

lib/
  feature-flags.ts      → SCAN_LABEL, ENRICH_WINE
  wine-helpers.ts       → sanitizeWineName() OBLIGATOIRE
  supabase/             → client.ts, server.ts, middleware.ts
```

### Règle app/page.tsx
C'est le SEUL endroit où les vins Excel et les vins manuels sont fusionnés.
Ne jamais dupliquer cette logique ailleurs.

### Règle WineExpertPanel
Doit toujours recevoir `wineName` en prop. Sans ça, "Trouver en ligne" → "Vin inconnu".

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

## 🗄 Supabase — Pièges critiques

- RLS obligatoire sur toutes les tables : `user_id = auth.uid()`
- Ne jamais court-circuiter avec `if (!userId) return []` sans vérifier
  que useAuth() a fini de résoudre (risque : cave vide après login)
- Pattern correct pour attendre la résolution :
```typescript
const { user, loading } = useAuth()
if (loading) return <Skeleton />
if (!user) return null
```
- Variables d'env : modifier uniquement via le dashboard Vercel (pas via MCP)
- `NEXT_PUBLIC_` sur les clés Supabase → warning Vercel normal, ignorer

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

## 🚨 Protocole incident prod

Si un bug apparaît en production :
1. STOP — ne pas empiler de correctifs
2. Lire les logs Vercel pour identifier le commit fautif
3. `git revert <hash>` → push → vérifier Vercel
4. Si revert insuffisant → hard reset vers dernier commit stable
5. Sauvegarder le travail sur une branche dédiée avant tout reset
6. Corriger sur `claude/fix-xxx` → PR vers `develop` → test iPhone → `main`

---

## 📦 Dépendances — Règles pnpm

```bash
# Après tout pnpm add :
pnpm install --no-frozen-lockfile
# Puis pousser pnpm-lock.yaml — cause #1 de build failures Vercel
```

---

## 🔑 localStorage Keys

```javascript
cave-manual-wines       // Vins manuels
cave-stock-overrides    // Surcharges stock
cave-user-profile       // Prénom + settings
```

---

## 📋 Template pour décrire une tâche à Claude Code

Toute demande doit préciser :
1. Contexte : quel fichier, quel composant, quel comportement actuel
2. Objectif : ce qui doit changer précisément
3. Fichiers autorisés à modifier
4. Fichiers interdits à toucher
5. Branche cible : `claude/nom-feature` depuis `develop`
6. Cible PR : `develop`
