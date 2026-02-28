'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Wine } from '@/data/apogee'

const CAVE_KEY = 'cave_data'
const CAVE_TS_KEY = 'cave_ts'

export function useCave() {
  const [cave, setCave] = useState<Wine[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load cave data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CAVE_KEY)
      const ts = localStorage.getItem(CAVE_TS_KEY)
      if (stored) {
        setCave(JSON.parse(stored))
      }
      if (ts) {
        setLastUpdated(ts)
      }
    } catch (e) {
      console.error('Error loading cave data:', e)
    }
    setIsLoaded(true)
  }, [])

  // Save cave data to localStorage
  const saveCave = useCallback((data: Wine[]) => {
    const ts = new Date().toISOString()
    try {
      localStorage.setItem(CAVE_KEY, JSON.stringify(data))
      localStorage.setItem(CAVE_TS_KEY, ts)
    } catch (e) {
      console.error('Error saving cave data:', e)
    }
    setCave(data)
    setLastUpdated(ts)
  }, [])

  // Clear cave data from localStorage
  const clearCave = useCallback(() => {
    try {
      localStorage.removeItem(CAVE_KEY)
      localStorage.removeItem(CAVE_TS_KEY)
    } catch (e) {
      console.error('Error clearing cave data:', e)
    }
    setCave([])
    setLastUpdated(null)
  }, [])

  return { cave, saveCave, clearCave, lastUpdated, isLoaded }
}
