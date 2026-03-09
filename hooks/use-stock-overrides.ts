'use client'

import { useState, useEffect, useCallback } from 'react'

export interface StockOverride {
  quantity?: number
  archived?: boolean
  deleted?: boolean
}

export function useStockOverrides() {
  const [overrides, setOverrides] = useState<Record<string, StockOverride>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('cave-stock-overrides')
    if (stored) {
      try {
        setOverrides(JSON.parse(stored))
      } catch (e) {
        console.error('[v0] Failed to parse stock overrides:', e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Persist to localStorage whenever overrides change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cave-stock-overrides', JSON.stringify(overrides))
    }
  }, [overrides, isLoaded])

  const getWineKey = useCallback((wineName: string | null, millesime: string | number | null): string => {
    return `${wineName || ''}_${millesime || ''}`
  }, [])

  const getOverride = useCallback(
    (wineName: string | null, millesime: string | number | null): StockOverride | undefined => {
      return overrides[getWineKey(wineName, millesime)]
    },
    [overrides, getWineKey]
  )

  const setOverride = useCallback(
    (wineName: string | null, millesime: string | number | null, override: StockOverride) => {
      const key = getWineKey(wineName, millesime)
      setOverrides((prev) => ({
        ...prev,
        [key]: override,
      }))
    },
    [getWineKey]
  )

  const clearOverride = useCallback((wineName: string | null, millesime: string | number | null) => {
    const key = getWineKey(wineName, millesime)
    setOverrides((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [getWineKey])

  return { overrides, isLoaded, getOverride, setOverride, clearOverride, getWineKey }
}
