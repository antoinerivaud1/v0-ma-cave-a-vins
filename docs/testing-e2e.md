# Tests E2E — Playwright

## Lancer en local

Prérequis : avoir fait un `next build` au moins une fois.

```bash
# Installer les navigateurs (à faire une seule fois)
node_modules/.bin/playwright install chromium

# Lancer les tests (le webServer démarre next start automatiquement)
pnpm test:e2e
```

## Lancer contre un preview Vercel

```bash
BASE_URL=https://ma-cave-preview.vercel.app pnpm test:e2e
```

Le `webServer` n'est pas lancé quand `BASE_URL` est défini.

## Ajouter un spec

1. Créer `tests/e2e/<nom>.spec.ts`
2. Importer `{ test, expect }` depuis `"@playwright/test"`
3. Double quotes partout (règle ESLint du projet)
4. Aucune écriture Supabase depuis les tests — les specs doivent fonctionner en mode invité

## Configuration

Voir `playwright.config.ts` à la racine :
- `testDir`: `./tests/e2e`
- Projet unique : Chromium en viewport iPhone 13 (390×844)
- `retries: 1`, `trace: "on-first-retry"`
