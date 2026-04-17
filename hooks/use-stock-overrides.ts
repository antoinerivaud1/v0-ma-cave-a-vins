"use client"

import { useCallback, useEffect, useSyncExternalStore } from "react"
import type { Wine } from "@/data/apogee"
import { getWineIdentityKey, type StockOverride } from "@/lib/stock-overrides"
import { CAVE_STORAGE_KEYS } from "@/lib/cave-storage"

const STORAGE_KEY = CAVE_STORAGE_KEYS.stockOverrides

type OverridesMap = Record<string, StockOverride>

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
    loadOverridesFromStorage()
    emitChange()

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

  const getOverrideForWine = useCallback((wine: Wine): StockOverride | undefined => {
    return overrides[getWineKeyFromWine(wine)]
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
