"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { WineEnrichment } from "@/lib/types"
import type { WineEnrichment as LegacyWineEnrichment } from "@/app/api/enrich-wine/route"
import type { Wine } from "@/data/apogee"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

// ── Legacy hook (localStorage cache) ─────────────────────────────────────────
// Utilisé par wine-card, add-wine-sheet, settings

const STORAGE_KEY = "cave-wine-enrichments"
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

function makeKey(wineName: string, millesime?: string | number): string {
  return `${wineName}_${millesime ?? ""}`
}

export function useWineEnrichmentLegacy() {
  const [cache, setCache] = useState<Record<string, LegacyWineEnrichment>>({})
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
    (wineName: string, millesime?: string | number): LegacyWineEnrichment | null => {
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

      setEnriching((prev: Set<string>) => new Set(prev).add(key))

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
        const data: LegacyWineEnrichment = await res.json()
        setCache((prev: Record<string, LegacyWineEnrichment>) => ({ ...prev, [key]: data }))
      } catch {
        // fail silently — enrichissement optionnel
      } finally {
        setEnriching((prev: Set<string>) => {
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

  const resetEnrichments = useCallback(() => {
    setCache({})
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { getEnrichment, enrichWine, isEnriching, isLoaded, resetEnrichments }
}

// ── Nouveau hook Supabase (MA-59) ─────────────────────────────────────────────
// Lit le cache wine_enrichments, appelle l'API IA si absent

// Cache mémoire session — évite les requêtes Supabase répétées pour le même wineId
const enrichmentCache = new Map<string, WineEnrichment>()

export function useWineEnrichment(
  wineId: string | null,
  autoEnrich: boolean = false
): {
  enrichment: WineEnrichment | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  enrich: () => Promise<void>
} {
  const { user } = useAuth()
  const cached = wineId ? enrichmentCache.get(wineId) : undefined
  const [enrichment, setEnrichment] = useState<WineEnrichment | null>(cached ?? null)
  const [isLoading, setIsLoading] = useState(!!wineId && !cached)
  const [error, setError] = useState<string | null>(null)

  // Chargement initial : lit le cache Supabase, déclenche l'IA si autoEnrich=true
  useEffect(() => {
    let cancelled = false

    async function init() {
      if (!wineId || !user) {
        setIsLoading(false)
        return
      }

      // Cache hit mémoire → pas de requête réseau
      const memCached = enrichmentCache.get(wineId)
      if (memCached) {
        setEnrichment(memCached)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        const supabase = createClient()

        // 1. Lecture cache Supabase
        const { data } = await supabase
          .from("wine_enrichments")
          .select("*")
          .eq("wine_id", wineId)
          .eq("user_id", user.id)
          .maybeSingle()

        if (cancelled) return
        const cached = data as WineEnrichment | null

        if (cached) {
          // Cache hit — aucun appel IA
          enrichmentCache.set(wineId, cached)
          setEnrichment(cached)
        } else if (autoEnrich) {
          // Cache miss + auto-enrich → appel API
          const res = await fetch("/api/enrich-wine", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wineId }),
          })
          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(
              (body as { error?: string }).error ?? "Enrichissement impossible"
            )
          }
          if (cancelled) return
          // Relire depuis Supabase après upsert
          const { data: fresh } = await supabase
            .from("wine_enrichments")
            .select("*")
            .eq("wine_id", wineId)
            .eq("user_id", user.id)
            .maybeSingle()
          if (!cancelled) {
            if (fresh) enrichmentCache.set(wineId, fresh as WineEnrichment)
            setEnrichment(fresh as WineEnrichment | null)
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur de chargement")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void init()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wineId, user?.id, autoEnrich])

  // Re-lecture depuis Supabase (sans appel IA)
  const refresh = useCallback(async () => {
    if (!wineId || !user) return
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("wine_enrichments")
        .select("*")
        .eq("wine_id", wineId)
        .eq("user_id", user.id)
        .maybeSingle()
      setEnrichment(data as WineEnrichment | null)
    } catch {
      setError("Erreur lors du chargement")
    } finally {
      setIsLoading(false)
    }
  }, [wineId, user])

  // Déclenche l'enrichissement IA puis relit depuis Supabase
  const enrich = useCallback(async () => {
    if (!wineId || !user) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/enrich-wine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wineId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(
          (body as { error?: string }).error ?? "Enrichissement impossible"
        )
      }
      const supabase = createClient()
      const { data } = await supabase
        .from("wine_enrichments")
        .select("*")
        .eq("wine_id", wineId)
        .eq("user_id", user.id)
        .maybeSingle()
      const fresh = data as WineEnrichment | null
      if (fresh) enrichmentCache.set(wineId, fresh)
      setEnrichment(fresh)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enrichissement impossible")
    } finally {
      setIsLoading(false)
    }
  }, [wineId, user])

  return { enrichment, isLoading, error, refresh, enrich }
}


// ── Hook batch Supabase (MA-74) ──────────────────────────────────────────────
// Charge en UNE requête les enrichissements de plusieurs vins (dashboard, liste),
// pour aligner l'apogée de la carte sur celle de la fiche détail. Réutilise le
// cache mémoire session `enrichmentCache` — la fiche détail en bénéficie ensuite.

export function useWineEnrichmentsBatch(
  wineIds: (string | null | undefined)[]
): { map: Map<string, WineEnrichment>; isLoading: boolean } {
  const { user } = useAuth()

  const ids = useMemo(() => {
    const seen = new Set<string>()
    for (const id of wineIds) {
      if (typeof id === "string" && id.length > 0) seen.add(id)
    }
    return Array.from(seen).sort()
  }, [wineIds])
  const idsKey = ids.join(",")

  const [map, setMap] = useState<Map<string, WineEnrichment>>(() => {
    const m = new Map<string, WineEnrichment>()
    for (const id of ids) {
      const cached = enrichmentCache.get(id)
      if (cached) m.set(id, cached)
    }
    return m
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!user || ids.length === 0) {
        setMap(new Map())
        setIsLoading(false)
        return
      }

      // Amorçage depuis le cache session — 0 requête pour les ids déjà connus
      const next = new Map<string, WineEnrichment>()
      const missing: string[] = []
      for (const id of ids) {
        const cached = enrichmentCache.get(id)
        if (cached) next.set(id, cached)
        else missing.push(id)
      }
      setMap(new Map(next))

      if (missing.length === 0) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("wine_enrichments")
          .select("*")
          .in("wine_id", missing)
          .eq("user_id", user.id)

        if (cancelled) return
        if (data) {
          for (const row of data as WineEnrichment[]) {
            enrichmentCache.set(row.wine_id, row)
            next.set(row.wine_id, row)
          }
          setMap(new Map(next))
        }
      } catch {
        // silencieux — l'apogée retombe sur l'heuristique
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, user?.id])

  return { map, isLoading }
}
