"use client"

import { useCallback, useEffect, useSyncExternalStore } from "react"
import type { Wine } from "@/data/apogee"
import { getWineIdentityKey, type StockOverride } from "@/lib/stock-overrides"
import { CAVE_STORAGE_KEYS } from "@/lib/cave-storage"

const STORAGE_KEY = CAVE_STORAGE_KEYS.stockOverrides

type OverridesMap = Record<string, StockOverride>

// Stable reference returned when a wine has no override — prevents new-object-per-call
// from dirtying useMemo / useEffect dependency arrays.
const EMPTY_OVERRIDE: StockOverride = Object.freeze({})

let overridesStore: OverridesMap = {}
let hasLoadedOverrides = false
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return overridesStore
}

function loadOverridesFromStorage() {
  if (hasLoadedOverrides || typeof window === 'undefined') return

  hasLoadedOverrides = true

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (!stored) return

  try {
    overridesStore = JSON.parse(stored)
  } catch (e) {
    console.error('[v0] Failed to parse stock overrides:', e)
  }
}

function persistOverrides(nextOverrides: OverridesMap) {
  overridesStore = nextOverrides

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextOverrides))
  }

  emitChange()
}

export function clearAllStockOverrides() {
  hasLoadedOverrides = true
  overridesStore = {}

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY)
  }

  emitChange()
}

export function useStockOverrides() {
  useEffect(() => {
    // Guard: only load + emit when this is the first mounted subscriber.
    // Without this guard, every WineCard calling useStockOverrides() would
    // call emitChange() on mount, triggering N×N synchronous re-renders via
    // useSyncExternalStore and freezing the UI on large lists.
    if (!hasLoadedOverrides) {
      loadOverridesFromStorage()
      emitChange()
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return

      if (!event.newValue) {
        overridesStore = {}
        emitChange()
        return
      }

      try {
        overridesStore = JSON.parse(event.newValue)
        emitChange()
      } catch (e) {
        console.error('[v0] Failed to parse stock overrides:', e)
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const overrides = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const isLoaded = hasLoadedOverrides

  const getWineKeyFromWine = useCallback((wine: Wine): string => {
    return getWineIdentityKey(wine)
  }, [])

  const getOverrideForWine = useCallback((wine: Wine): StockOverride => {
    // Primary key: new identity format (id: or fallback:…)
    const newKey = getWineKeyFromWine(wine)
    const stored = overrides[newKey]
    if (stored !== undefined) return stored

    // Legacy fallback: old "name_millesime" format used before b1dd216 / PR #38.
    // Keeps existing overrides readable after the key-format migration.
    const legacyKey = `${wine.wine_name ?? ""}_${wine.millesime_year ?? ""}`
    return overrides[legacyKey] ?? EMPTY_OVERRIDE
  }, [getWineKeyFromWine, overrides])

  const setOverrideForWine = useCallback((wine: Wine, override: StockOverride) => {
    const key = getWineKeyFromWine(wine)
    persistOverrides({
      ...overridesStore,
      [key]: override,
    })
  }, [getWineKeyFromWine])

  const clearOverrideForWine = useCallback((wine: Wine) => {
    const key = getWineKeyFromWine(wine)
    const next = { ...overridesStore }
    delete next[key]
    persistOverrides(next)
  }, [getWineKeyFromWine])

  return {
    overrides,
    isLoaded,
    getWineKeyFromWine,
    getOverrideForWine,
    setOverrideForWine,
    clearOverrideForWine,
  }
}
