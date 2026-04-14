# PROJECT_STATE.md — Ma Cave à Vins

> Source de vérité instantanée pour Claude Code. Mis à jour à chaque fin de session.
> Dernière mise à jour : 14 avril 2026
> Tracking produit : Linear (linear.app/ma-cave-a-vin)

---

## Sprint actif : 3.5 — Fiche Vin Enrichie (IA)

### Tickets Linear — ordre d'exécution strict

| ID | Titre | Statut | Priorité |
|---|---|---|---|
| MA-33 | ⚠️ Renouveler token GitHub avant le 19 avril 2026 | Todo | Urgent |
| MA-52 | Inspecter develop-sprint-3-work avant cherry-pick WineDetailSheet | Todo | Urgent |
| MA-5 | Créer table wine_enrichments dans Supabase | Todo | Urgent |
| MA-6 | Mettre à jour enrich-wine/route.ts — schéma complet | Todo | Urgent |
| MA-7 | Créer composant taste-profile-bars.tsx (sous-feature C) | Todo | High |
| MA-8 | Câbler WineDetailSheet — sections enrichies A/B/D/E + skeleton | Todo | High |
| MA-9 | Tests device réel + merge main — Sprint 3.5 | Todo | High |

### Prochaine tâche
MA-33 — Renouveler le token GitHub (expire le 19 avril 2026)
Puis MA-52 — Inspecter develop-sprint-3-work avant tout code Sprint 3.5

---

## État du repo

| Branche | État |
|---|---|
| `main` | ✅ Stable — Sprints 3.3 + 3.4 terminés |
| `develop` | ✅ Propre — prêt pour Sprint 3.5 |
| `develop-sprint-3-work` | ⚠️ Sauvegarde UX non validée — inspecter avant tout cherry-pick (MA-52) |

### Dernières PRs mergées (ordre chronologique)
- PR #39 — cloud hardening Sprint 3.4 (1 avril 2026)
- PR #40 — lockfile sync + Supabase/RLS follow-up (4 avril 2026)
- PR #49 — cave vide après login, race condition useAuth (7 avril 2026)
- PR #51 — stock_overrides migration Supabase (7 avril 2026)
- PR claude/fix-consumption-format — unification clé stock getWineIdentityKey (7 avril 2026)
- PR claude/wine-cellar-movement-f6zAJ — déplacement vin entre caves (12 avril 2026)
- PR claude/update-claude-md-project-state — CLAUDE.md + PROJECT_STATE.md (13 avril 2026)

---

## Tests
- Suite Vitest : 11/11 passent
- TypeScript : propre (tsc --noEmit)
- Build : OK sur Vercel

---

## Modèle freemium — 3 tiers

| Tier | Prix | Limites clés |
|---|---|---|
| Gratuit | 0€ | 50 bouteilles, 1 cave, pas de scan IA |
| Amateur | 3,49€/mois | Illimité, 1 cave, scan IA, export CSV |
| Collectionneur | 6,99€/mois | Illimité, multi-cave, fiche enrichie complète, export PDF |

```
isPremium = plan === 'premium' || role === 'beta' || role === 'admin'
subscription_tier : 'free' | 'amateur' | 'collector'
```

---

## Backlog tech debt prioritaire (Linear)

| ID | Titre | Priorité |
|---|---|---|
| MA-10 | Next.js 16.1.7+ (5 CVE actives) | High |
| MA-42 | Fix N+1 : remonter useCaves() au niveau shell | High |
| MA-43 | Fix canMove toujours faux | High |
| MA-11 | Réactiver ignoreBuildErrors | Medium |
| MA-44 | Single quotes → double quotes (95 fichiers) | Medium |
| MA-45 | sanitizeWineName() manquante dans suggestion-card.tsx | Medium |
| MA-51 | Dépendances vulnérables (xlsx, recharts, zod, sdk) | Medium |

---

## Décisions récentes
- 14 avril 2026 : Sprint 3.5 = Fiche Vin Enrichie (priorité sur refonte UI 3.6/3.7)
- 14 avril 2026 : Tracking produit migré de Notion vers Linear
- 14 avril 2026 : Notion conservé uniquement pour business/entreprise
- 13 avril 2026 : Modèle freemium confirmé à 3 tiers (Gratuit / Amateur / Collectionneur)

---

## Outils et accès

| Ressource | Valeur |
|---|---|
| GitHub | antoinerivaud1/v0-ma-cave-a-vins |
| Vercel prod | v0-ma-cave-a-vins.vercel.app |
| Vercel project | prj_rnbCuyK7DTuLbC8bfur8ChwyFgtd |
| Supabase | chriywwlnihmclbrjmta.supabase.co |
| Linear | linear.app/ma-cave-a-vin |
