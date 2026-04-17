# Audit multi-cave — 2026-04-08

## Résumé exécutif

La plomberie de base (hook `useCaves`, `WineMoveSheet`, logique `canMove` dans `WineCardActions`) est implémentée et fonctionnelle, mais le câblage entre les couches est rompu à deux endroits critiques : `WineCard` ne transmet jamais `wineId`/`wineCaveId` à `WineCardActions` (donc `canMove` est toujours `false`), et la liste principale dans `cave-list.tsx` utilise une carte inline sans actions du tout — `WineCard` n'est rendu que pour les vins archivés. De plus, `app/page.tsx` n'utilise pas `useCaves()` et ne passe aucune information de cave active vers `AppShell`.

---

## use-caves.ts

- **moveWine** : MISSING — aucune fonction `moveWine` n'existe dans le hook. Le déplacement est géré directement dans `WineMoveSheet` via un appel Supabase inline.
- **setActiveCave** : EXISTS — exportée (ligne 70), met à jour l'état local, localStorage et `profiles.last_active_cave_id` dans Supabase.
- **activeCaveId exposé** : OUI — présent dans le `return` (ligne 168), de type `string | null`.
- **activeCave (objet)** : NON — seul `activeCaveId` (string) est exposé ; l'objet Cave complet (avec `name`) n'est pas calculé ni retourné.
- **last_active_cave_id Supabase** : OUI — mis à jour dans `setActiveCave` (lignes 76–81) et aussi lors de `deleteCave` si la cave supprimée était active (lignes 148–153).

---

## cave-list.tsx

- **Composant rendu** : Carte custom inline (`<div>` avec layout manuel, lignes 236–288) pour la liste principale filtrée. `WineCard` est utilisé UNIQUEMENT pour les vins archivés (ligne 306). Les deux variantes coexistent.
- **Props wineId + wineCaveId passées** : NON — la carte inline principale n'a ni menu d'actions, ni `WineCard`, ni `WineCardActions`. Le `WineCard` des archivés est appelé sans `wineId` ni `wineCaveId` (`<WineCard wine={wine} />`, ligne 306).
- **Action déplacer branchée** : ABSENT — aucun handler de déplacement dans `cave-list.tsx`. La carte inline déclenche uniquement `onWineSelect?.(wine)` au tap.

---

## wine-card-actions.tsx

- **Action "Déplacer" présente** : OUI — item `ArrowRightLeft` "Déplacer vers..." présent (lignes 136–144).
- **Branchée sur handler réel** : OUI — ouvre `WineMoveSheet` via `setShowMoveSheet(true)` (ligne 139) ; la sheet effectue un vrai appel Supabase.
- **Conditionnelle au nb de caves** : OUI — `canMove = !!user && !!wineId && caves.length > 1 && !isArchived` (ligne 72). L'item est masqué si une seule cave.
- **Gatée par plan premium** : NON — aucune vérification `isPremium`.

> **Problème bloquant** : `wineId` n'est jamais fourni par `WineCard` (voir section suivante), donc `canMove` est systématiquement `false` et l'action n'apparaît jamais.

---

## wine-card.tsx

> Note : le composant expose `WineCardActions` (lignes 176–187) mais ne lui passe pas `wineId` ni `wineCaveId`.

```tsx
// Lignes 176-187 — props transmises à WineCardActions
<WineCardActions
  wineName={...}
  millesime={...}
  currentQuantity={displayQuantity}
  isArchived={isArchived}
  onConsume={handleConsume}
  onLastBottleConsume={...}
  onQuantityChange={handleQuantityChange}
  onArchive={handleArchive}
  onRestore={handleRestore}
  onDelete={handleDelete}
  // wineId  ← ABSENT
  // wineCaveId ← ABSENT
  // onMoved  ← ABSENT
/>
```

`WineCard` ne reçoit que `wine` et `onWineUpdate` en props (interface ligne 27–30) ; aucun `wineId` Supabase ni `wineCaveId` n'est disponible dans son interface.

---

## wine-move-sheet.tsx

- **Liste caves en prop** : NON — le composant appelle `useCaves()` en interne (ligne 33) pour obtenir la liste.
- **Move branché** : OUI — `handleMove` (lignes 38–53) fait un vrai `supabase.update({ cave_id: targetCaveId })` et appelle `onMoved()` + fermeture de la sheet.
- **Cave active exclue** : NON (partiellement) — le filtre est `caves.filter((c) => c.id !== wine.cave_id)` (ligne 36), donc c'est la **cave courante du vin** qui est exclue, pas la cave active. Si le vin n'a pas de `cave_id` renseigné (`null`), toutes les caves apparaissent. La cave active est seulement mise en valeur visuellement (point rouge + label "Active", lignes 84–106) mais pas exclue.

---

## wine-detail-sheet.tsx

- **Action "Déplacer" présente** : NON — la barre d'actions fixe en bas (lignes 307–323) ne contient que deux boutons : "⋯ Actions" (`onActionsOpen`) et "− Consommer" (`onConsume`). Aucune action de déplacement.
- **Branchée** : N/A

---

## app/page.tsx

- **Nom cave active affiché** : NON — `page.tsx` n'utilise pas `useCaves()`. Le header de `CaveList` affiche "Mes Vins" en dur (cave-list.tsx ligne 173).
- **moveWine passé en prop** : NON — `moveWine` n'existe pas dans `useCaves`. `page.tsx` passe à `AppShell` : `cave, lastUpdated, isOfflineCache, onImport, onClear, onAddWine, onReload`.
- **activeCave passé à AppShell** : NON — ni `activeCaveId` ni l'objet `activeCave` ne sont passés à `AppShell`.

---

## Actions requises pour 5B, 5C, 5D

### Bloquants — le flux "déplacer" ne fonctionne pas du tout

1. **`WineCard` : ajouter `wineId` et `wineCaveId` en props** et les transmettre à `WineCardActions`. Sans ça, `canMove` est toujours `false`.
2. **`cave-list.tsx` : la carte inline principale n'a pas d'actions menu**. Soit remplacer la carte inline par `WineCard` (avec passage de `wineId`/`wineCaveId`), soit ajouter un `WineCardActions` à la carte inline.

### Manquants — cave active non exposée dans l'UI

3. **`useCaves` : exposer `activeCave` (objet complet)** calculé à partir de `caves.find(c => c.id === activeCaveId)` pour permettre l'affichage du nom.
4. **`app/page.tsx` : brancher `useCaves()`** et passer `activeCaveId` / `activeCave` à `AppShell`.
5. **`AppShell` / `CaveList` : afficher le nom de la cave active** dans le header en lieu et place de "Mes Vins" (ou en sous-titre), pour indiquer à l'utilisateur dans quelle cave il se trouve.

### Améliorations souhaitables

6. **`wine-move-sheet.tsx` : exclure la cave active** (pas seulement `wine.cave_id`) ou au moins s'assurer que `wine.cave_id` est toujours renseigné avant d'ouvrir la sheet.
7. **`wine-detail-sheet.tsx` : ajouter "Déplacer vers..."** dans la barre d'actions en bas (cohérence avec la fiche détail).
8. **Gate premium optionnel** : décider si `canMove` doit être conditionné à `isPremium` (actuellement non gaté — à valider avec Antoine).
