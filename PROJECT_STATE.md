# PROJECT_STATE.md — Ma Cave à Vins

> Source de vérité instantanée. Mis à jour à chaque fin de session.
> Dernière mise à jour : 13 avril 2026

---

## Sprint actif : 3.5 — Fiche Vin Enrichie (IA)

### Tickets Linear

| ID | Titre | Statut |
|---|---|---|
| MA-5 | Créer table wine_enrichments dans Supabase | Todo |
| MA-6 | Mettre à jour enrich-wine/route.ts — schéma complet | Todo |
| MA-7 | Créer composant taste-profile-bars.tsx (sous-feature C) | Todo |
| MA-8 | Câbler WineDetailSheet — sections enrichies A/B/D/E | Todo |
| MA-9 | Tests device réel + merge main | Todo |

### Prochaine tâche
MA-5 — Créer table `wine_enrichments` dans Supabase (avec RLS)

---

## État du repo

| Branche | État |
|---|---|
| `main` | ✅ Stable — Sprint 3.4 terminé |
| `develop` | ✅ Propre — prêt pour Sprint 3.5 |
| `develop-sprint-3-work` | ⚠️ Sauvegarde UX — NE PAS merger sans inspection |

### Dernières PRs mergées
- PR #49 — cave vide après login (7 avril 2026)
- PR #51 — stock_overrides migration Supabase (7 avril 2026)
- PR claude/fix-consumption-format — unification clé stock (7 avril 2026)
- PR claude/wine-cellar-movement-f6zAJ — déplacement vin entre caves (12 avril 2026)

---

## Tests
- Suite Vitest : 11/11 passent
- TypeScript : propre
- Build : OK sur Vercel (hors sandbox)

---

## Backlog tech debt (Linear)

| ID | Titre | Priorité |
|---|---|---|
| MA-10 | Next.js 16.1.7+ (5 CVE actives) | High |
| MA-11 | Réactiver ignoreBuildErrors | Medium |
| MA-12 | Politique de confidentialité | Medium |
| MA-13 | Versionner migrations Supabase | Medium |

---

## Décisions récentes
- Sprint 3.5 = Fiche Vin Enrichie (priorité sur refonte UI 3.6/3.7)
- Tracking produit migré de Notion vers Linear
- Notion conservé uniquement pour business/entreprise
