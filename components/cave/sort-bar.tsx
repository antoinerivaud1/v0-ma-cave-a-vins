'use client'

import { X } from 'lucide-react'

export type SortKey = 'millesime' | 'region' | 'apogee' | null

interface SortBarProps {
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onSort: (key: SortKey, dir?: 'asc' | 'desc') => void
}

const SORT_OPTIONS = [
  { key: 'millesime' as const, label: 'Millésime' },
  { key: 'region' as const, label: 'Région' },
  { key: 'apogee' as const, label: 'Apogée' },
]

export function SortBar({ sortKey, sortDir, onSort }: SortBarProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto px-4 py-2"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      {SORT_OPTIONS.map((opt) => {
        const isActive = sortKey === opt.key
        const arrow = isActive ? (sortDir === 'asc' ? '↑' : '↓') : ''

        return (
          <button
            key={opt.key}
            onClick={() => {
              if (isActive) {
                // Toggle direction
                onSort(opt.key, sortDir === 'asc' ? 'desc' : 'asc')
              } else {
                // Activate with default ascending
                onSort(opt.key, 'asc')
              }
            }}
            className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-cave-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
            }`}
          >
            <span>{opt.label}</span>
            {arrow && <span className="text-xs">{arrow}</span>}
            {isActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSort(null)
                }}
                className="ml-0.5 rounded-full p-0 hover:opacity-70"
                aria-label="Réinitialiser le tri"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </button>
        )
      })}
    </div>
  )
}
