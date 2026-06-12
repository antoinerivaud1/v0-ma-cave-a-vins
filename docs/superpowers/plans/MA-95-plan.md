# Plan MA-95 - T2 Synthese v1 : BottomNav + Dashboard

## References design (dans le repo)
- docs/superpowers/specs/synthese-v1/components.jsx : primitives BigTile, StatPill, Watermark, FAB, BottomNav (l.46+)
- docs/superpowers/specs/synthese-v1/screens.jsx : ScreenCave (l.9+) = cible visuelle du Dashboard
- tokens deja en place (MA-94) : --ink, --bg, --paper-2, --rouge..., --border-hard 2px, --shadow-hard 3px 3px 0 0, classes via @theme --color-*

## Branche
`feat/ma-95-synthese-v1-nav-dashboard` depuis develop (9d4c761)

## Fichiers
1. NOUVEAUX composants partages `components/cave/synthese/` (reutilises par T3-T6) :
   - `watermark.tsx` : filigrane typographique Cormorant italique top-right (opacity via --watermark-opacity, pointer-events-none, aria-hidden)
   - `big-tile.tsx` : tuile bordure 2px encre + ombre offset 3px, props bg/fg/label(kicker uppercase)/shadow/onClick, watermark optionnel
   - `stat-pill.tsx` : label kicker + grosse valeur tabular-nums + sous-texte
   - (PAS de FAB separe si le FAB actuel du dashboard est inline : restyler sur place)
2. `components/cave/bottom-nav.tsx` (47 l.) : restyle Synthese v1 (fond creme/bordure encre en haut, onglet actif encre + font-weight 700, inactif --ink-soft), MEMES 5 onglets, MEMES TabId, safe-area-inset-bottom conserve, z-50 conserve
3. `components/cave/dashboard.tsx` (295 l.) : restyle pur visuel
   - header salutation : h1 Cormorant italique, kicker date
   - stats -> grille de BigTile/StatPill comme ScreenCave (tuile rouge "EN CAVE" + tuiles type de vin, tuile "A BOIRE" apogee, tuile astuce bordure dashed)
   - "Le saviez-vous" -> BigTile paper-2 bordure 1.5px dashed sans ombre
   - sections recentes : kickers uppercase + cartes bordure 2px
   - FAB : rond, bordure 2px encre, ombre offset, fond --rouge
   - AUCUN changement de logique : hooks, stats useMemo, handlers, sheets, paywall, ComingSoonOverlay INTACTS ; sanitizeWineName conserve partout ; imports lucide ajustes UNIQUEMENT si une icone devient inutilisee (verifier Camera reste importe si utilise)
4. INTERDIT de toucher : wine-card.tsx, wine-card-actions.tsx, cave-list.tsx, app-shell.tsx (routing), paywall-sheet.tsx, fichiers interdits CLAUDE.md

## Garde-fous
Double quotes ; aucun hex hardcode (tokens/classes only) ; safe-area ; z-50 nav ; etat vide cave (AC3) garde un rendu propre ; noms longs tronques (truncate) (AC4)

## Gates
typecheck, lint, vitest 16/16, build, e2e 7/7 (LD_LIBRARY_PATH workaround), verif locale du rendu invite (inchange structurellement)

## Lecons applicables
- e2e limite au mur invite : le Dashboard n'est PAS couvert par les e2e -> la verif visuelle du checkpoint humain est importante sur ce ticket
