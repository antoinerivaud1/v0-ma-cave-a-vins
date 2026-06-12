# Ma Cave à Vins — Design System · Synthèse v1

Ce dossier contient le design system **Synthèse v1**, la nouvelle direction visuelle
de l'app Ma Cave à Vins (PWA française, gestion de cave personnelle).

Il remplace intégralement la direction précédente "dark luxury wine".

## Caractère

- **Hors-Série + barres de cycle de vie + courbe de pic de dégustation.**
- Fond crème chaud, encre noire-brune, accent rouge bordeaux.
- Bordure dure 2px + offset shadow 3px 3px 0 = signature visuelle.
- Cormorant Garamond italique pour la voix, Inter pour la fonction.
- Filigrane typographique en top-right de chaque carte colorée.
- Pas de gradient, pas de glassmorphism, pas d'emoji (sauf 👋).

## Pages

| Page | Contenu |
|---|---|
| `01 Foundations — Colors.html`       | Surfaces, couleurs de vin, statuts de cycle, règles |
| `02 Foundations — Typography.html`   | Système, échelle, référence rapide, règles |
| `03 Foundations — Spacing & Shadows.html` | Bordures, rayons, ombres, padding, gap, tokens |
| `04 Components.html`                 | WineTile, BigTile, CycleChart, ApogeeBar, FAB, BottomNav, pills, etc. |
| `05 Patterns.html`                   | Filigrane, statuts, écrans, copy, iconographie, à ne jamais faire |

Tous chargent `tokens.css` qui définit les CSS custom properties partagées.

## Status / cycle de vie

| Statut    | Plage   | Couleur          | Ton         |
|-----------|---------|------------------|-------------|
| À garder  | < 30%   | `--garde` #4A6FA5  | patient     |
| Optimal   | 30–50%  | `--optimal` #6B7A3E | serein      |
| Apogée    | 50–85%  | `--apogee` #B33A2E | engageant   |
| Urgent    | > 85%   | `--urgent` #C1452A | pressant    |

## Système typographique

- **Display** : Cormorant Garamond italique (500/600). Titres, citations, marginalia, filigrane.
- **Sans** : Inter (400/500/600/700). UI, labels, métriques, millésimes (`tabular-nums`).
- Aucune autre police. Pas de Caveat. Pas de "manuscrit".

## À copier dans le repo

Pour porter ces tokens dans `v0-ma-cave-a-vins/develop` :
- `tokens.css` → `app/globals.css` (en remplacement de la direction dark).
- Variantes couleurs vins → `tailwind.config.ts` (rouge, blanc, bulle, rose, urgent, apogee, optimal, garde).
- Google Fonts (Cormorant + Inter) → injection dans `app/layout.tsx`.

## Prototype hi-fi

Le fichier `Ma Cave a Vins - Synthese v1.html` (à la racine du projet) montre
le système en action sur 4 écrans cliquables (Cave / Liste / Détail / Carnet)
plus Accords et Réglages, avec un panneau de Tweaks pour basculer les variantes.
