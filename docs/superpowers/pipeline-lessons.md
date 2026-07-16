# Pipeline lessons - Ma Cave à Vins

## 2026-06-12 - MA-100
Erreur : chromium Playwright ne se lance pas dans la sandbox Cowork (libxdamage1 absente, sudo indisponible).
Cause : image sandbox minimale, `playwright install --with-deps` exige sudo.
Règle : installer la lib sans sudo (`apt-get download libxdamage1 && dpkg -x ... /tmp/locallibs`) puis exporter `LD_LIBRARY_PATH=/tmp/locallibs/usr/lib/$(uname -m)-linux-gnu`. Documenté dans docs/testing-e2e.md.

## 2026-06-12 - MA-100
Erreur : les specs e2e prévues au cadrage (bottom nav 5 onglets) étaient injouables : en mode invité l'app n'affiche qu'un mur de connexion, AppShell non rendu.
Cause : l'app exige une session Supabase pour rendre la nav ; pas de compte de test e2e.
Règle : pour les prochains plans, toute spec e2e au-delà du mur invité nécessite un compte de test dédié (à provisionner, hors prod data) ou un mode storage-state pré-authentifié. Les specs des tickets UI (MA-94 à MA-99) doivent en tenir compte.

## 2026-06-13 - MA-97
Erreur : le refactor vers une source unifiée (apogee) a perdu un statut legacy ("late"), changeant silencieusement le scoring des suggestions et le widget "À boire" (QA B1/B2, 1 itération corrective).
Cause : couche de compat conçue sur les statuts cibles, pas sur la sémantique legacy complète.
Règle : tout refactor avec couche de compat doit énumérer TOUS les états legacy et prouver l'équivalence par des tests dédiés AVANT de migrer les consommateurs.

## 2026-07-17 - MA-74
Erreur : test de parité créé en `lib/apogee-unified.test.ts`, jamais exécuté par vitest ("No test files found").
Cause : `vitest.config.ts` n'inclut que `tests/**/*.test.ts` — pas de tests colocalisés.
Règle : tout nouveau test unitaire va dans `tests/`. Vérifier l'`include` de vitest.config avant d'écrire un test. Bonus : vérifier si un test existant couvre déjà le sujet (ici `tests/apogee-unified.test.ts` couvrait déjà la parité IA/heuristique).

## 2026-07-17 - MA-74
Erreur : `pnpm` indisponible dans la sandbox Cowork (corepack EACCES sur /usr/bin), puis `packages field missing` avec pnpm 9.
Cause : sandbox sans pnpm préinstallé ; le `pnpm-workspace.yaml` du repo utilise la syntaxe pnpm 10 (`allowBuilds`), incompatible pnpm 9. Les process lancés en arrière-plan (nohup/setsid) sont tués par la sandbox.
Règle : setup sandbox = `npm config set prefix ~/.npm-global && npm i -g pnpm@10 && export PATH="$HOME/.npm-global/bin:$PATH"`. Installer en foreground avec `--prefer-offline` et relancer si timeout (le store survit entre les appels). Jamais de nohup pour les installs.

## 2026-07-17 - MA-74
Erreur : validation humaine bloquée ~5 min, "serveur introuvable" puis Cloudflare 521 sur l'app.
Cause : projet Supabase (chriywwlnihmclbrjmta, plan gratuit) passé INACTIVE après ~1 semaine d'inactivité. Ce n'est ni l'app ni le déploiement Vercel.
Règle : avant d'envoyer le CHECKPOINT (et idéalement dès l'Étape 0 après une période creuse), vérifier `get_project` Supabase ; si INACTIVE, `restore_project` et attendre ACTIVE_HEALTHY (~2-3 min) AVANT de donner l'URL de preview à Antoine.

## 2026-07-17 - MA-74
Erreur : la preview Vercel brute renvoie un mur d'authentification Vercel (perçu comme "serveur KO").
Cause : protection deployment activée sur les previews du team.
Règle : au CHECKPOINT, toujours fournir l'URL via `get_access_to_vercel_url` (lien `_vercel_share`, valable ~23h), jamais l'URL de preview brute.

## 2026-07-17 - MA-74
Leçon positive (à conserver) : le ticket datait du 5 mai, la refonte Synthèse v1 (juin) avait changé le fond du bug — la cause décrite (getApogee legacy) n'existait plus, remplacée par des appels `getUnifiedApogee(wine)` sans enrichissement. La règle "re-valider le diagnostic d'un ticket >1 mois contre le code actuel avant de planifier" a évité un plan faux. La maintenir systématiquement en Phase 2.
