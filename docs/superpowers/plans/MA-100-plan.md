# Plan MA-100 - Setup Playwright (tests/e2e)

## Branche
`chore/ma-100-setup-playwright` depuis develop (32005a5)

## Fichiers
1. `package.json` : devDependency `@playwright/test` (derniere stable) + script `"test:e2e": "playwright test"`
2. `pnpm-lock.yaml` : regenere (`pnpm install --no-frozen-lockfile`)
3. `playwright.config.ts` (nouveau) :
   - `testDir: "./tests/e2e"`
   - `baseURL: process.env.BASE_URL || "http://localhost:3000"`
   - `webServer` lance automatiquement `node_modules/.bin/next start` (apres build) UNIQUEMENT si BASE_URL absent (`reuseExistingServer: true`)
   - projet unique sandbox-friendly: chromium avec viewport iPhone 13 (390x844, deviceScaleFactor 3, isMobile, hasTouch). PAS de webkit (deps systeme fragiles en CI/sandbox)
   - retries: 1, trace: "on-first-retry"
4. `tests/e2e/smoke.spec.ts` (nouveau) : l'app charge (title/body), la bottom nav affiche 5 onglets (Cave, Carnet, Liste, Accords, Reglages), la navigation entre onglets change le contenu
5. `tests/e2e/cave.spec.ts` (nouveau) : l'onglet Cave s'affiche (etat vide accepte en invite) ; si des cartes vin existent: ouverture fiche + fermeture sheet ; sinon assertion de l'etat vide. Les specs doivent etre robustes a l'absence de donnees (mode invite, AUCUNE ecriture Supabase)
6. `docs/testing-e2e.md` (nouveau) : doc courte (lancer en local, lancer contre un preview avec BASE_URL, ajouter un spec)

## Environnement local (sandbox uniquement, JAMAIS commite)
`.env.local` avec NEXT_PUBLIC_SUPABASE_URL=https://chriywwlnihmclbrjmta.supabase.co et NEXT_PUBLIC_SUPABASE_ANON_KEY=(anon key fournie au codeur). Verifier que .gitignore couvre .env.local AVANT tout commit.

## Garde-fous
- Double quotes partout (ESLint quotes error) ; les specs passent au lint
- vitest.config.ts inclut uniquement tests/**/*.test.ts : pas de collision avec *.spec.ts ; ne pas le modifier
- Aucun fichier interdit. Aucune migration. Aucune ecriture Supabase depuis les tests

## Ordre
1. Branche -> 2. deps + config -> 3. specs -> 4. GATE typecheck + lint -> 5. vitest (16/16, non-regression) -> 6. build -> 7. `playwright install chromium` (+ --with-deps si necessaire) -> 8. run e2e local (BASE_URL absent => webServer) -> 9. commit (sans .env.local) ; PAS de push (orchestrateur s'en charge)

## Spec Playwright
Ce ticket EST le setup Playwright.
