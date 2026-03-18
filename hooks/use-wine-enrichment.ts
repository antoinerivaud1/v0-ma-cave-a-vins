"use client"

import { useState, useEffect, useCallback } from "react"
import type { WineEnrichment } from "@/app/api/enrich-wine/route"
import type { Wine } from "@/data/apogee"

const STORAGE_KEY = "cave-wine-enrichments"
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

function makeKey(wineName: string, millesime?: string | number): string {
  return `${wineName}_${millesime ?? ""}`
}

export type { WineEnrichment }

export function useWineEnrichment() {
  const [cache, setCache] = useState<Record<string, WineEnrichment>>({})
  const [enriching, setEnriching] = useState<Set<string>>(new Set())
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setCache(JSON.parse(stored))
    } catch {
      // ignore parse errors
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
    }
  }, [cache, isLoaded])

  const getEnrichment = useCallback(
    (wineName: string, millesime?: string | number): WineEnrichment | null => {
      const key = makeKey(wineName, millesime)
      const entry = cache[key]
      if (!entry) return null
      if (Date.now() - entry.enrichedAt > CACHE_TTL_MS) return null
      return entry
    },
    [cache]
  )

  const enrichWine = useCallback(
    async (wine: Wine): Promise<void> => {
      const name = wine.wine_name ?? ""
      if (!name) return

      const key = makeKey(name, wine.millesime_year)

      if (enriching.has(key) || cache[key]) return

      setEnriching((prev) => new Set(prev).add(key))

      try {
        const res = await fetch("/api/enrich-wine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wineName: name,
            millesime: wine.millesime_year,
            region: wine.wine_region,
            appellation: wine.wine_appellation,
          }),
        })

        if (!res.ok) return

        const data: WineEnrichment = await res.json()
        setCache((prev) => ({ ...prev, [key]: data }))
      } catch {
        // fail silently — enrichissement optionnel
      } finally {
        setEnriching((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }
    },
    [cache, enriching]
  )

  const isEnriching = useCallback(
    (wineName: string, millesime?: string | number): boolean => {
      return enriching.has(makeKey(wineName, millesime))
    },
    [enriching]
  )

  return { getEnrichment, enrichWine, isEnriching, isLoaded }
}
