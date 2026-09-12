# PROJECT_STATE.md : Ma Cave à Vins

> État instantané du projet. Mis à jour à chaque fin de session.
> Dernière mise à jour : 12 septembre 2026 (audit de reprise)

---

## Où on en est

Le produit web est fonctionnellement complet pour la Phase 3 (cave, multi-cave, scan IA, enrichissement IA avec recherche web, Carnet de dégustation, accords, freemium avec paywall FOMO) et la refonte visuelle Synthèse v1 est livrée sur `develop`.

**Mais rien de tout cela n'est en prod** : `main` date du 14 mai 2026 (PR #94), `develop` a 34 commits d'avance. Aucune des livraisons de juin/juillet n'a été testée sur iPhone.

**Chemin critique : Phase B (Feature Freeze Validation, MA-103 → MA-109).** Elle bloque la Phase 4 (RevenueCat), la Phase 5 (Expo) et la Phase 6 (stores).

---

## Milestone active : Phase B : Feature Freeze Validation

| ID | Titre | Statut |
|---|---|---|
| MA-103 | B1 Prérequis : restaurer Supabase + build vert | In Progress (Supabase restauré, checks verts sur develop) |
| MA-110 | Bump Next.js 16.3.5 (CVE critical) | In Progress (branche prête) |
| MA-111 | Versionner `tastings`, dédoublonner migrations | Todo (branche prête) |
| MA-113 | Bug stock_overrides : sync cloud jamais fonctionnelle | Todo (décision produit) |
| MA-104 | B2 Device : ajout de vin (manuel + scan) | Backlog |
| MA-105 | B3 Device : cycle de vie du stock | Backlog (dépend de MA-113) |
| MA-106 | B4 Device : enrichissement IA | Backlog |
| MA-107 | B5 Device : rendu Synthèse v1 + safe area | Backlog |
| MA-108 | B6 Device : gating freemium | Backlog |
| MA-109 | B7 Merge develop → main | Backlog |

Hors milestone, en cours : MA-85 (ce fichier et CLAUDE.md), MA-112 (consolidation des skills).

---

## État du repo

| Branche | État |
|---|---|
| `main` | Prod, figée au 14 mai 2026 (Sprint 3.5.1 partiel) |
| `develop` | Staging, vert (tsc, lint, vitest 35/35, build), dernier commit 17 juillet 2026 |
| `claude/*` | ~85 branches mergées non supprimées (MA-87, nettoyage après B7) |
| `develop-sprint-3-work` | Archive, ne pas merger |

Branches préparées le 12 septembre (à pousser en PR vers develop) :
- `claude/ma-110-next-16-3-cve` : Next 16.2.9 → 16.3.5
- `claude/chore-audit-overrides` : overrides pnpm, audit 34 → 3 alertes (xlsx sans patch)
- `claude/ma-111-tastings-migration` : migration `tastings`, migrations `stock_overrides` et `wine_enrichments` dédoublonnées
- `claude/ma-85-docs-resync` : ce fichier, CLAUDE.md, `.cursorrules`, scripts `typecheck` et `check`

---

## Qualité

| Check | develop (12/09/2026) |
|---|---|
| `pnpm typecheck` | 0 erreur |
| `pnpm lint` | 0 erreur, 4 warnings `<img>` |
| `pnpm test` | 35/35 |
| `pnpm build` | OK |
| `pnpm audit --prod` | 34 alertes avant, 3 après overrides (xlsx : MA-51) |

---

## Prod Supabase (12/09/2026)

Restaurée après pause. Données intactes : 33 vins, 4 dégustations, 15 enrichissements, 2 profils. `stock_overrides` : 0 ligne (MA-113).

---

## Décisions ouvertes (à trancher avec Antoine)

1. MA-113 : le stock devient cloud (Supabase) ou reste local par design ?
2. MA-7 : `taste-profile-bars.tsx` a-t-il encore un sens après Synthèse v1 ?
3. MA-12 / MA-41 : la politique de confidentialité est-elle à jour ? Fermer MA-12 si oui.
4. MA-67 : PR #64 (conflit PROJECT_STATE.md) : fermer.
5. Après Phase B : Phase 4 RevenueCat ou MA-93 (enrichissement en masse) en premier ?

---

## Backlog notable

- MA-93 : enrichissement IA en masse (spec écrite, VineProgressBar via Claude Design)
- MA-62 : cache partagé `wine_enrichments` entre utilisateurs
- MA-63 : prompt engineering enrichissement (reliquat : few-shot, éval 10 vins)
- MA-53 : notation des vins (note perso + note web)
- MA-54 / MA-55 : partage de cave, export PDF (Collectionneur)
- MA-46, MA-48, MA-49, MA-50, MA-51, MA-86, MA-87 : dette technique (audit Codex)
- Phase 4 : MA-56 (RevenueCat), MA-57 (paywall + subscription + downgrade)

---

## Historique récent

- 17 juil. 2026 : MA-74 apogée unifiée carte / fiche (PR #110, #111)
- 13 juin 2026 : MA-92 fix Android scan, MA-101 enrichissement web search, MA-102 re-enrichissement forcé, MA-97 → MA-99 Synthèse v1
- 12 juin 2026 : MA-94 → MA-96 Synthèse v1 fondations, dashboard, CaveList ; MA-100 Playwright
- 14 mai 2026 : dernier merge develop → main (Sprint 3.5.1 : rate limit, gate scan-label, paywall FOMO, enums plan/role)
