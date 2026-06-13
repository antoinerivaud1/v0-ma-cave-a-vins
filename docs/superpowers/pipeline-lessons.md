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
