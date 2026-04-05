"use client"

import { useCallback, useEffect, useState } from "react"
import type { Wine } from "@/data/apogee"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { useCaves } from "@/hooks/use-caves"
import { clearAllLocalCaveData } from "@/lib/cave-storage"
import { clearAllStockOverrides } from "@/hooks/use-stock-overrides"
import { getWineSyncIdentityKey } from "@/lib/wine-sync"

interface WineRow {
  id: string
  user_id: string
  cave_id: string | null
  name: string
  vintage: string | null
  quantity: number | null
  region: string | null
  appellation: string | null
  domain: string | null
  wine_type: string | null
  classification: string | null
  notes: string | null
  created_at?: string | null
  updated_at?: string | null
}

const WINE_SELECT =
  "id, user_id, cave_id, name, vintage, quantity, region, appellation, domain, wine_type, classification, notes, created_at, updated_at"

function mapRowToWine(row: WineRow): Wine {
  return {
    id: row.id,
    cave_id: row.cave_id,
    wine_name: row.name,
    millesime_year: row.vintage ?? undefined,
    bottle_quantity: Number(row.quantity ?? 0),
    wine_region: row.region ?? undefined,
    wine_appellation: row.appellation ?? undefined,
    wine_domain: row.domain ?? undefined,
    wine_type: row.wine_type ?? undefined,
    wine_classification: row.classification ?? undefined,
    wine_notes: row.notes ?? undefined,
    _manual: true,
  }
}

function mapWineToRow(wine: Wine, userId: string, caveId: string) {
  return {
    user_id: userId,
    cave_id: caveId,
    name: wine.wine_name ?? "",
    vintage: wine.millesime_year != null ? String(wine.millesime_year) : null,
    quantity: Number(wine.bottle_quantity ?? 0),
    region: wine.wine_region ?? null,
    appellation: wine.wine_appellation ?? null,
    domain: wine.wine_domain ?? null,
    wine_type: wine.wine_type ?? null,
    classification: wine.wine_classification ?? null,
    notes: wine.wine_notes ?? null,
  }
}

function getFallbackIdentityKey(wine: {
  cave_id?: string | null
  wine_name?: string | null
  millesime_year?: string | number | null
  wine_domain?: string | null
  wine_appellation?: string | null
}): string {
  return getWineSyncIdentityKey({
    cave_id: wine.cave_id ?? null,
    wine_name: wine.wine_name ?? null,
    millesime_year: wine.millesime_year ?? null,
    wine_domain: wine.wine_domain ?? null,
    wine_appellation: wine.wine_appellation ?? null,
  })
}

export function useCloudCave() {
  const { user } = useAuth()
  const { caves, activeCaveId, loading: cavesLoading, createCave, setActiveCave } = useCaves()
  const [wines, setWines] = useState<Wine[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const ensureActiveCaveId = useCallback(async (): Promise<string | null> => {
    if (!user) return null

    if (activeCaveId) return activeCaveId

    const firstCave = caves[0]
    if (firstCave) {
      await setActiveCave(firstCave.id)
      return firstCave.id
    }

    const created = await createCave("Ma Cave")
    if (!created) return null

    await setActiveCave(created.id)
    return created.id
  }, [activeCaveId, caves, createCave, setActiveCave, user])

  const loadWines = useCallback(async (caveId: string, userId: string): Promise<void> => {
    setIsLoaded(false)

    const supabase = createClient()
    const { data, error } = await supabase
      .from("wines")
      .select(WINE_SELECT)
      .eq("user_id", userId)
      .eq("cave_id", caveId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[cloud-cave] Failed to load wines:", error)
      setWines([])
      setLastUpdated(null)
      setIsLoaded(true)
      return
    }

    const rows = (data ?? []) as WineRow[]
    setWines(rows.map(mapRowToWine))
    setLastUpdated(new Date().toISOString())
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!user) {
      setWines([])
      setLastUpdated(null)
      setIsLoaded(true)
      return
    }

    if (cavesLoading) return

    ensureActiveCaveId().then((caveId) => {
      if (!caveId) {
        setWines([])
        setLastUpdated(null)
        setIsLoaded(true)
        return
      }
      loadWines(caveId, user.id)
    })
  }, [user, cavesLoading, activeCaveId, ensureActiveCaveId, loadWines])

  const addWine = useCallback(
    async (wine: Wine): Promise<void> => {
      if (!user) return

      const caveId = await ensureActiveCaveId()
      if (!caveId) return

      const supabase = createClient()
      const { data, error } = await supabase
        .from("wines")
        .insert(mapWineToRow(wine, user.id, caveId))
        .select(WINE_SELECT)
        .single()

      if (error) {
        console.error("[cloud-cave] Failed to add wine:", error)
        return
      }

      if (data) {
        setWines((prev) => [mapRowToWine(data as WineRow), ...prev])
        setLastUpdated(new Date().toISOString())
      }
    },
    [ensureActiveCaveId, user]
  )

  const importWines = useCallback(
    async (importedWines: Wine[]): Promise<void> => {
      if (!user || importedWines.length === 0) return

      const caveId = await ensureActiveCaveId()
      if (!caveId) return

      const supabase = createClient()
      const { data: existingRows, error } = await supabase
        .from("wines")
        .select(WINE_SELECT)
        .eq("user_id", user.id)
        .eq("cave_id", caveId)

      if (error) {
        console.error("[cloud-cave] Failed to fetch existing wines for import:", error)
        return
      }

      const existingByKey = new Map<string, WineRow>()
      for (const row of (existingRows ?? []) as WineRow[]) {
        existingByKey.set(
          getFallbackIdentityKey({
            cave_id: row.cave_id,
            wine_name: row.name,
            millesime_year: row.vintage,
            wine_domain: row.domain,
            wine_appellation: row.appellation,
          }),
          row
        )
      }

      const updates = []
      const inserts = []

      for (const wine of importedWines) {
        const key = getFallbackIdentityKey({ ...wine, cave_id: caveId })
        const existingRow = existingByKey.get(key)
        const nextRow = mapWineToRow(wine, user.id, caveId)

        if (existingRow) {
          updates.push(
            supabase
              .from("wines")
              .update(nextRow)
              .eq("id", existingRow.id)
          )
        } else {
          inserts.push(nextRow)
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates)
      }

      if (inserts.length > 0) {
        const { error: insertError } = await supabase.from("wines").insert(inserts)
        if (insertError) {
          console.error("[cloud-cave] Failed to insert imported wines:", insertError)
        }
      }

      clearAllLocalCaveData()
      clearAllStockOverrides()
      await loadWines(caveId, user.id)
    },
    [ensureActiveCaveId, loadWines, user]
  )

  const clearCave = useCallback(async (): Promise<void> => {
    clearAllLocalCaveData()
    clearAllStockOverrides()

    if (!user) {
      setWines([])
      setLastUpdated(null)
      return
    }

    const supabase = createClient()
    const [{ error: tastingError }, { error: wineError }] = await Promise.all([
      supabase.from("tastings").delete().eq("user_id", user.id),
      supabase.from("wines").delete().eq("user_id", user.id),
    ])

    if (tastingError) {
      console.error("[cloud-cave] Failed to clear tastings:", tastingError)
    }

    if (wineError) {
      console.error("[cloud-cave] Failed to clear wines:", wineError)
      return
    }

    setWines([])
    setLastUpdated(null)
  }, [user])

  const reloadCave = useCallback(async (): Promise<void> => {
    if (!user) return
    const caveId = await ensureActiveCaveId()
    if (!caveId) return
    await loadWines(caveId, user.id)
  }, [ensureActiveCaveId, loadWines, user])

  return {
    cave: wines,
    lastUpdated,
    isLoaded,
    addWine,
    importWines,
    clearCave,
    reloadCave,
  }
}
