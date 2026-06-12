# Plan MA-96 - T3 Synthese v1 : CaveList + WineCard

## References design (repo)
- docs/superpowers/specs/synthese-v1/components.jsx : WineTile (l.99+), FilterPill
- docs/superpowers/specs/synthese-v1/screens.jsx : ScreenListe (l.230+)
- Primitives MA-95 disponibles : components/cave/synthese/{watermark,big-tile,stat-pill}.tsx

## Branche
`feat/ma-96-synthese-v1-cavelist-winecard` depuis develop (7381433)

## Fichiers
1. NOUVEAU `components/cave/synthese/filter-pill.tsx` : pill bordure 1.5-2px encre, active = fond encre texte creme, inactive = transparent texte ink-soft, radius pill
2. `components/cave/wine-card.tsx` (276 l.) : restyle WineTile Synthese v1
   - bande/fond couleur par type : wine_red->--rouge, wine_white->--blanc, wine_sparkling->--bulle, wine_rose->--rose (+ -fg correspondants), badge type conserve (getLabel couvre wine_rose, MA-70)
   - bordure 2px encre + ombre offset, millesime tabular-nums, nom en Cormorant (truncate, sanitizeWineName conserve PARTOUT)
   - REGLE CRITIQUE : structure <button> de toggle + <WineCardActions> EN DEHORS du button -> NE PAS restructurer le JSX a ce niveau, ne changer que les styles ; wine-card-actions.tsx INTOUCHE
   - etat expanded (toggle) : restyle leger coherent (paper-2, separateurs encre)
3. `components/cave/cave-list.tsx` (264 l.) : restyle conteneur liste
   - header kicker + compteur bouteilles StatPill ; etat vide Synthese v1 (BigTile dashed, deja "Aucun vin trouve")
   - FilterBar/SortFilterDropdown : si restyle profond necessaire, se limiter a l'harmonisation couleurs via tokens (les composants gardent leur logique) ; sinon les laisser tels quels (alias cave-* assurent la coherence)
4. INTERDITS : wine-card-actions.tsx, app-shell.tsx, dashboard.tsx (verifier quand meme imports lucide dashboard apres modif wine-card, regle CLAUDE.md), fichiers interdits CLAUDE.md

## Garde-fous
Double quotes ; aucun hex ; sanitizeWineName ; truncate noms longs ; stock 0 / grandes quantites lisibles ; AC1 toggle + menu 3 points independants (structure intacte)

## Gates
typecheck, lint, vitest 16/16, build, e2e 7/7 (LD_LIBRARY_PATH workaround)

## Lecons
- e2e limites au mur invite : verif visuelle humaine au checkpoint
- Nettoyer les imports lucide devenus inutilises dans les fichiers modifies (lecon MA-95 : ni TS ni ESLint ne les detectent)
