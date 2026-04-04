"use client"

import { getWineIdentityKey } from "@/lib/stock-overrides"
import type { Wine } from "@/data/apogee"

export interface PersistedWineRow {
  id?: string
  cave_id?: string | null
  name?: string | null
  vintage?: string | null
  domain?: string | null
  appellation?: string | null
}

export function getWineSyncIdentityKey(input: {
  cave_id?: string | null
  wine_name?: string | null
  millesime_year?: string | number | null
  wine_domain?: string | null
  wine_appellation?: string | null
}): string {
  return getWineIdentityKey({
    cave_id: input.cave_id ?? null,
    wine_name: input.wine_name ?? null,
    millesime_year: input.millesime_year ?? null,
    wine_domain: input.wine_domain ?? null,
    wine_appellation: input.wine_appellation ?? null,
  })
}

export function getPersistedWineRowIdentityKey(row: PersistedWineRow): string {
  return getWineSyncIdentityKey({
    cave_id: row.cave_id ?? null,
    wine_name: row.name ?? null,
    millesime_year: row.vintage ?? null,
    wine_domain: row.domain ?? null,
    wine_appellation: row.appellation ?? null,
  })
}

export function mergeLocalWineSources(importedWines: Wine[], manualWines: Wine[], caveId: string): Wine[] {
  const mergedByKey = new Map<string, Wine>()

  for (const wine of [...importedWines, ...manualWines]) {
    const identityKey = getWineSyncIdentityKey({
      cave_id: caveId,
      wine_name: wine.wine_name ?? null,
      millesime_year: wine.millesime_year ?? null,
      wine_domain: wine.wine_domain ?? null,
      wine_appellation: wine.wine_appellation ?? null,
    })

    mergedByKey.set(identityKey, { ...wine, cave_id: caveId })
  }

  return [...mergedByKey.values()].filter(
    (wine) => Number(wine.bottle_quantity ?? 0) > 0 && Boolean(wine.wine_name ?? wine.wine_appellation)
  )
}
