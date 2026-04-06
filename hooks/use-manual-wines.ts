"use client"

import { useState, useEffect, useCallback } from "react"
import type { Wine } from "@/data/apogee"
import { useAuth } from "@/hooks/use-auth"
import { syncWineToSupabase } from "@/hooks/use-cave-sync"

const STORAGE_KEY = "cave-manual-wines"

/**
 * @deprecated — Remplacé par useCloudCave. Conserver uniquement pour use-cave-sync.ts (migration one-shot).
 */
export function useManualWines() {
  const [manualWines, setManualWines] = useState<Wine[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setManualWines(JSON.parse(stored))
    } catch (e) {
      console.error("[cave] Failed to parse manual wines:", e)
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(manualWines))
    }
  }, [manualWines, isLoaded])

  const addWine = useCallback(
    (wine: Wine) => {
      setManualWines((prev) => [wine, ...prev])
      if (user?.id) {
        syncWineToSupabase(wine, user.id)
      }
    },
    [user]
  )

  const clearManualWines = useCallback(() => {
    setManualWines([])
  }, [])

  return { manualWines, isLoaded, addWine, clearManualWines }
}
