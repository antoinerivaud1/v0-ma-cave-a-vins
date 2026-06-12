# Plan MA-94 - T1 Fondations Synthese v1

## Ecarts constates vs ticket
- PAS de tailwind.config.ts : Tailwind v4 config CSS-first via `@theme inline` dans app/globals.css. Les variantes couleurs deviennent des tokens @theme (ex: --color-rouge), PAS un fichier config.
- Fonts deja chargees via next/font (Inter + Cormorant_Garamond, variables --font-inter / --font-cormorant) : ne PAS injecter de Google Fonts par URL. Ajouter style italic a Cormorant si absent (la voix Synthese v1 est l'italique).
- styles/globals.css (125 lignes) existe mais n'est pas importe par app/layout.tsx : NE PAS y toucher.

## Branche
`feat/ma-94-synthese-v1-fondations` depuis develop (06f2091)

## Sources design (sandbox)
`/sessions/vibrant-funny-bardeen/mnt/outputs/new-ui/` : design-system/ (tokens.css canonique, README.md, 5 pages HTML), prototype (app.jsx, screens.jsx, components.jsx, data.js, tweaks-panel.jsx), screenshots/.

## Fichiers
1. `docs/superpowers/specs/synthese-v1/` (nouveau) : copier design-system/* + les 5 fichiers prototype (jsx/js) + screenshots/*.png si < 500 Ko piece
2. `app/globals.css` (REECRITURE) :
   - conserver `@import "tailwindcss"` + `@import "tw-animate-css"` (passer les imports en double quotes)
   - :root = tokens Synthese v1 (surfaces --bg #F5EFE2, --paper-2, --ink, --ink-soft, --ink-faint ; vins --rouge/--blanc/--bulle/--rose + -fg ; semantique --urgent/--apogee/--optimal/--garde/--gold/--destructive/--success ; radius ; --border-hard, --shadow-hard, --shadow-accent ; --watermark-opacity)
   - mapper les tokens shadcn (--background, --foreground, --primary, --card, --border, --muted, etc.) vers Synthese v1 : background=--bg, foreground=--ink, primary=--rouge, etc.
   - `@theme inline` : exposer --color-* pour rouge, blanc, bulle, rose, urgent, apogee, optimal, garde, gold, ink, ink-soft, ink-faint, paper-2 + font-sans=var(--font-inter), font-serif/display=var(--font-cormorant)
   - ALIAS de transition : redefinir les anciens tokens --cave-gold, --cave-bg, --cave-text, --cave-muted, --cave-card, --cave-border, --cave-bordeaux, --cave-terracotta, --cave-rouge-* vers les valeurs Synthese v1 les plus proches (gold->--bulle #D9A852, bg->--bg, text->--ink, muted->--ink-soft, card->--paper-2, border->--ink, bordeaux/rouge-*->--rouge) pour que les 31 fichiers qui les utilisent restent lisibles sur fond creme
   - SUPPRIMER `@custom-variant dark` et tout bloc .dark
   - classes utilitaires typographiques du tokens.css (h1/h2/kicker) adaptees en classes ou laissees aux tickets T2+ (minimal ici)
3. `app/layout.tsx` : ajouter style italic a Cormorant_Garamond si necessaire ; rien d'autre
4. AUCUN composant ecran touche

## Gates et verification
typecheck, lint, vitest 16/16, build, e2e Playwright 7/7 (LD_LIBRARY_PATH=/tmp/locallibs/usr/lib/aarch64-linux-gnu). Verif visuelle: page invite sur fond creme.

## Garde-fous
Double quotes partout (y compris CSS). Aucun hex hors de globals.css (les hex des tokens y sont legitimes). Fichiers interdits intouchables. Lockfile non concerne (pas de dep).

## Lecons applicables
- e2e: workaround libxdamage1 (pipeline-lessons 2026-06-12)
- e2e limites au mur invite : suffisant pour T1 (le mur invite change de style mais pas de structure)
