'use client'

import { useState, useMemo } from 'react'
import { PageHeader } from './page-header'
import { FilterBar } from './filter-bar'
import { WineCard } from './wine-card'
import { getApogee } from '@/data/apogee'
import type { Wine } from '@/data/apogee'

/* ── Filter options ──────────────────────────────── */

const COLOR_FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'wine_red', label: '\uD83C\uDF77 Rouge' },
  { key: 'wine_white', label: '\uD83E\uDD42 Blanc' },
  { key: 'wine_white_sparkling', label: '\u2728 Petillant' },
]

const LEVEL_FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'exceptional', label: '\u2B50 Exceptionnels' },
  { key: 'drink', label: '\u23F0 A boire' },
]

/* ── Helpers ─────────────────────────────────────── */

function isExceptional(wine: Wine): boolean {
  const a = getApogee(wine)
  const year = parseInt(String(wine.millesime_year))
  return !!(a && a.st === 'ok' && !isNaN(year) && year <= 2015)
}

function isDrinkNow(wine: Wine): boolean {
  const a = getApogee(wine)
  return !!(a && (a.st === 'urgent' || a.st === 'late'))
}

/* ── Component ───────────────────────────────────── */

export interface CaveListProps {
  cave: Wine[]
  initialFilter?: { color?: string; level?: string }
}

export function CaveList({ cave, initialFilter }: CaveListProps) {
  const [colorFilter, setColorFilter] = useState(initialFilter?.color || 'all')
  const [levelFilter, setLevelFilter] = useState(initialFilter?.level || 'all')

  const filtered = useMemo(() => {
    let result = cave

    // Color filter
    if (colorFilter !== 'all') {
      result = result.filter((w) => w.wine_type === colorFilter)
    }

    // Level filter
    if (levelFilter === 'exceptional') {
      result = result.filter(isExceptional)
    } else if (levelFilter === 'drink') {
      result = result.filter(isDrinkNow)
    }

    return result
  }, [cave, colorFilter, levelFilter])

  const totalBottles = filtered.reduce(
    (sum, w) => sum + (Number(w.bottle_quantity) || 0),
    0
  )

  return (
    <div className="pb-4">
      <PageHeader
        title="Mes Vins"
        subtitle={`${totalBottles} bouteille${totalBottles !== 1 ? 's' : ''}`}
      />

      {/* Color filters */}
      <FilterBar
        options={COLOR_FILTERS}
        activeKey={colorFilter}
        onSelect={setColorFilter}
      />

      {/* Level filters */}
      <FilterBar
        options={LEVEL_FILTERS}
        activeKey={levelFilter}
        onSelect={setLevelFilter}
      />

      {/* Wine cards */}
      <div className="mt-2 flex flex-col gap-2.5 px-4">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-cave-border bg-card p-8 text-center">
            <p className="font-serif text-base text-foreground">Aucun vin</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Aucun vin ne correspond aux filtres selectionnes.
            </p>
          </div>
        )}

        {filtered.map((wine, i) => (
          <WineCard key={`${wine.wine_name}-${wine.millesime_year}-${i}`} wine={wine} />
        ))}
      </div>
    </div>
  )
}
