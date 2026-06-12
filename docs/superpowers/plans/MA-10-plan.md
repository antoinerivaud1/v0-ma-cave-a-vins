# Plan MA-10 - Upgrade Next.js 16.1.6 -> 16.2.9 (5 CVE actives)

## Contexte
- Branche existante `claude/upgrade-nextjs-security-xxGu0` (2a9ad5d): upgrade 16.2.6 deja ecrit, base sur develop d'avant les PRs #97 (quotes) et #98 (vitest)
- develop actuel: 007ae5c
- Derniere 16.2.x stable au 12 juin 2026: 16.2.9

## Strategie
Repartir de develop (007ae5c) sur une branche fraiche plutot que rebaser la branche orpheline (diff minuscule, plus sur de regenerer).

## Branche
`chore/ma-10-upgrade-nextjs-16-2-9`

## Fichiers a modifier
1. `package.json`: "next": "16.1.6" -> "16.2.9" ; "eslint-config-next": "^16.2.2" -> "^16.2.9"
2. `pnpm-lock.yaml`: regenere via `pnpm install --no-frozen-lockfile` (OBLIGATOIRE, regle CLAUDE.md)
3. `docs/superpowers/plans/MA-10-plan.md`: ce plan (commit avec)

## Aucun fichier interdit touche. Aucune migration Supabase. Aucune variable d'env.

## Ordre d'implementation
1. git checkout develop && git pull && git checkout -b chore/ma-10-upgrade-nextjs-16-2-9
2. Editer package.json (2 lignes)
3. pnpm install --no-frozen-lockfile
4. GATE: pnpm typecheck && pnpm lint (verts obligatoires)
5. pnpm test (vitest, les suites doivent rester vertes)
6. pnpm build (doit passer)
7. Commit atomique: "chore: upgrade next.js 16.1.6 -> 16.2.9 (5 CVE actives, MA-10)" + lockfile
8. Push + PR vers develop (titre ticket, lien Linear MA-10)

## Risques de regression
- Next 16.2.x: changements mineurs possibles sur turbopack/build; le build est le verificateur
- Conflit lockfile avec la vieille branche xxGu0: evite en repartant de develop
- proxy.ts (custom server?) a surveiller dans le build

## Spec Playwright
Non applicable (pas de tests/e2e dans le repo). QA = typecheck + lint + build + vitest + smoke test preview.

## Lecons applicables
Aucune (pipeline-lessons.md inexistant, premier run).
