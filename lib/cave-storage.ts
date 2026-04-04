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
} as const

export const ALL_CAVE_STORAGE_KEYS = Object.values(CAVE_STORAGE_KEYS)

export function clearAllLocalCaveData(): void {
  if (typeof window === "undefined") return

  for (const key of ALL_CAVE_STORAGE_KEYS) {
    window.localStorage.removeItem(key)
  }
}
