"use client"

export const CAVE_STORAGE_KEYS = {
  caveData: "cave_data",
  caveTimestamp: "cave_ts",
  manualWines: "cave-manual-wines",
  stockOverrides: "cave-stock-overrides",
  userProfile: "cave-user-profile",
  wineEnrichments: "cave-wine-enrichments",
  tastings: "cave-tastings",
  activeCaveId: "cave-active-cave-id",
  offlineCache: "cave-offline-cache",
} as const

// Clé de migration — séparée de CAVE_STORAGE_KEYS intentionnellement :
// elle ne doit PAS être effacée par clearAllLocalCaveData (qui est appelée après import).
export const MIGRATION_DONE_KEY = "cave-migration-done"

export const ALL_CAVE_STORAGE_KEYS = Object.values(CAVE_STORAGE_KEYS)

export function clearAllLocalCaveData(): void {
  if (typeof window === "undefined") return

  for (const key of ALL_CAVE_STORAGE_KEYS) {
    window.localStorage.removeItem(key)
  }
}
