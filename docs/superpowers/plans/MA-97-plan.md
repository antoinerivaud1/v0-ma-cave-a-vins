# Plan MA-97 - T4 Synthese v1 : Fiche detail + CycleChart/ApogeeBar + apogee unifiee

## Constats code
- data/apogee.ts : getApogee(wine) -> { st: "urgent"|"late"|"wait"|"ok", label } (heuristique, dispo pour tous les vins)
- wine_enrichments expose apogee_start / apogee_end (wine-detail-sheet.tsx l.97-99)
- getApogee consomme par : wine-card, suggestion-card, cave-list, wine-detail-sheet, dashboard, lib/suggest-helpers
- MA-74 : la fiche melange enrichissement et heuristique -> incoherences

## Branche
`feat/ma-97-synthese-v1-detail-apogee` depuis develop (79b922c)

## Architecture apogee unifiee
NOUVEAU `lib/apogee-unified.ts` :
- `getUnifiedApogee(wine, enrichment?)` -> `{ start: number|null, end: number|null, status: "garde"|"optimal"|"apogee"|"urgent", progress: number (0-1), estimated: boolean, label: string }`
- Si enrichment.apogee_start/end fournis : fenetre IA, estimated=false
- Sinon : deriver la fenetre de l'heuristique getApogee existante (reutiliser sa logique interne ; exporter de data/apogee.ts ce qui est necessaire SANS changer son comportement), estimated=true
- progress = position de l'annee courante dans la fenetre ; status par seuils spec : <30% garde, 30-50% optimal, 50-85% apogee, >85% urgent (et avant fenetre = garde, apres = urgent)
- helper `unifiedToLegacySt(status)` pour suggest-helpers (garde->"wait", optimal->"ok", apogee->"ok"/"late", urgent->"urgent") afin de ne PAS changer le scoring
- Consommateurs mis a jour : wine-detail-sheet (enrichment passe), wine-card + cave-list + dashboard + suggestion-card (sans enrichment -> estimated ; si le hook use-wine-enrichment expose un cache local synchrone sans appel reseau, l'utiliser, sinon heuristique). AC3 : meme fonction partout = coherence garantie a inputs egaux.

## Composants UI
NOUVEAUX components/cave/synthese/cycle-chart.tsx et apogee-bar.tsx, fideles au prototype (docs/superpowers/specs/synthese-v1/components.jsx : CycleChart, ApogeeBar) :
- ApogeeBar : barre segmentee fenetres garde/optimal/apogee/urgent avec curseur annee courante, couleurs var(--garde/--optimal/--apogee/--urgent), marqueur "estime" en Cormorant italique si estimated
- CycleChart : courbe de pic (svg) avec position courante, marqueur dore var(--gold)
- JAMAIS masques : mode estime pour vins sans enrichissement (AC2)

## Fiche detail (wine-detail-sheet.tsx, 442 l.)
- Restyle Synthese v1 : sections kicker uppercase, TasteBar inline restyle (tokens), accords, domaine ; header fiche avec surface couleur type (reutiliser mapping MA-96)
- Integrer CycleChart + ApogeeBar via getUnifiedApogee(wine, enrichment)
- ApogeeStatusBadge migre vers le statut unifie
- Regles sheet : max-h-[90dvh] flex flex-col, overflow-y-auto flex-1, z-[60] min, safe-area
- wine-enrichment-panel.tsx : restyle leger tokens uniquement, logique intacte
- INTERDITS : app/api/enrich-wine/route.ts, use-wine-enrichment.ts (logique ; lecture du cache OK), fichiers interdits CLAUDE.md, wine-card-actions.tsx

## Garde-fous
Double quotes ; aucun hex ; sanitizeWineName ; pas de nouvelle dependance ; erreur reseau enrichissement -> fallback heuristique sans crash (AC4) ; skeleton conserve

## Gates
typecheck, lint, vitest 16/16, build, e2e 7/7 + AJOUTER un test vitest unitaire tests/apogee-unified.test.ts (fenetre IA, fallback heuristique, seuils des 4 statuts, coherence dashboard/fiche)

## Lecons
Imports lucide a verifier manuellement dans chaque fichier modifie.
