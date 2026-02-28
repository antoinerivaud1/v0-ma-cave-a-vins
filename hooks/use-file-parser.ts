'use client'

import { useCallback, useState } from 'react'
import type { Wine } from '@/data/apogee'

export function useFileParser() {
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parseFile = useCallback(async (file: File): Promise<Wine[]> => {
    setIsParsing(true)
    setError(null)

    try {
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

      // Filter rows where bottle_quantity > 0
      const wines: Wine[] = rawData
        .map((row) => {
          const wine: Wine = {}
          for (const [key, value] of Object.entries(row)) {
            const normalizedKey = key
              .toLowerCase()
              .trim()
              .replace(/\s+/g, '_')
              .replace(/[^a-z0-9_]/g, '')
            wine[normalizedKey] = value as string | number
          }
          return wine
        })
        .filter((w) => {
          const qty = Number(w.bottle_quantity ?? w.quantity ?? w.qty ?? 0)
          w.bottle_quantity = qty
          return qty > 0
        })

      setIsParsing(false)
      return wines
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur de lecture du fichier'
      setError(message)
      setIsParsing(false)
      return []
    }
  }, [])

  return { parseFile, isParsing, error }
}
