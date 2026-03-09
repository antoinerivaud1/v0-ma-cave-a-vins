'use client'

import { useState, useMemo } from 'react'
import { Search, X, Wine as WineGlass, ChevronDown } from 'lucide-react'
import { PageHeader } from './page-header'
import { FilterBar } from './filter-bar'
import { SortFilterDropdown, type SortFilterState } from './sort-filter-dropdown'
import { WineCard } from './wine-card'
import { useStockOverrides } from '@/hooks/use-stock-overrides'
import { formatRegion } from '@/lib/wine-helpers'
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

/** Strip accents for accent-insensitive matching */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function isExceptional(wine: Wine): boolean {
  const a = getApogee(wine)
  const year = parseInt(String(wine.millesime_year))
  return !!(a && a.st === 'ok' && !isNaN(year) && year <= 2015)
}

function isDrinkNow(wine: Wine): boolean {
  const a = getApogee(wine)
  return !!(a && (a.st === 'urgent' || a.st === 'late'))
}

/** Normalize text for accent-insensitive sorting */
function normalizeForSort(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/** Compare wines by apogee status */
function compareApogee(a: Wine, b: Wine, dir: 'asc' | 'desc'): number {
  const statusOrder = { urgent: 0, late: 1, ok: 2, wait: 3 }
  const aStatus = getApogee(a)?.st || 'wait'
  const bStatus = getApogee(b)?.st || 'wait'
  const cmp = statusOrder[aStatus as keyof typeof statusOrder] - statusOrder[bStatus as keyof typeof statusOrder]
  return dir === 'asc' ? cmp : -cmp
}

/* ── Component ───────────────────────────────────── */

export interface CaveListProps {
  cave: Wine[]
  initialFilter?: { color?: string; level?: string }
}

export function CaveList({ cave, initialFilter }: CaveListProps) {
  const [colorFilter, setColorFilter] = useState(initialFilter?.color || 'all')
  const [levelFilter, setLevelFilter] = useState(initialFilter?.level || 'all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortFilterState, setSortFilterState] = useState<SortFilterState>({
    millesimeSort: null,
    selectedRegions: [],
    apogeeSort: null,
  })
  const [showArchived, setShowArchived] = useState(false)
  const { getOverride, isLoaded } = useStockOverrides()

  const filtered = useMemo(() => {
    if (!isLoaded) return []
    
    let result = cave.filter((w) => {
      const override = getOverride(w.wine_name, w.millesime_year)
      return !override?.deleted
    })

    // Text search — OR across 4 fields, AND with other filters
    if (searchQuery.trim()) {
      const q = normalize(searchQuery.trim())
      result = result.filter((w) => {
        const name = normalize(String(w.wine_name || ''))
        const region = normalize(formatRegion(String(w.wine_region || '')))
        const regionRaw = normalize(String(w.wine_region || ''))
        const cepage = normalize(String(w.wine_classification || ''))
        const millesime = String(w.millesime_year || '')
        return (
          name.includes(q) ||
          region.includes(q) ||
          regionRaw.includes(q) ||
          cepage.includes(q) ||
          millesime.includes(q)
        )
      })
    }

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

    // Region filter (multi-select)
    if (sortFilterState.selectedRegions.length > 0) {
      result = result.filter((w) => {
        const wineRegion = normalizeForSort(String(w.wine_region || ''))
        return sortFilterState.selectedRegions.some(
          (r) => normalizeForSort(r) === wineRegion
        )
      })
    }

    // Apply sorts
    if (sortFilterState.millesimeSort) {
      result = [...result].sort((a, b) => {
        const aYear = parseInt(String(a.millesime_year)) || 0
        const bYear = parseInt(String(b.millesime_year)) || 0
        const cmp = aYear - bYear
        return sortFilterState.millesimeSort === 'asc' ? cmp : -cmp
      })
    }

    if (sortFilterState.apogeeSort) {
      result = [...result].sort((a, b) => compareApogee(a, b, sortFilterState.apogeeSort!))
    }

    return result
  }, [cave, colorFilter, levelFilter, searchQuery, sortFilterState, isLoaded, getOverride])

  const archivedWines = useMemo(() => {
    if (!isLoaded) return []
    return cave.filter((w) => {
      const override = getOverride(w.wine_name, w.millesime_year)
      return override?.archived === true && !override?.deleted
    })
  }, [cave, isLoaded, getOverride])

  return (
    <div className="pb-4">
      <PageHeader
        title="Mes Vins"
        subtitle={`${totalBottles} bouteille${totalBottles !== 1 ? 's' : ''}`}
      />

      {/* Sticky search bar */}
      <div className="sticky top-0 z-20 bg-background/80 px-4 pb-2 pt-1 backdrop-blur-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un vin, region, cepage, millesime..."
            className="h-10 w-full rounded-lg border border-cave-border bg-card pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

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

      {/* Sort & Filter Dropdown */}
      <SortFilterDropdown cave={cave} state={sortFilterState} onStateChange={setSortFilterState} />

      {/* Wine cards */}
      <div className="mt-2 flex flex-col gap-2.5 px-4">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-cave-border bg-card p-8 text-center">
            <WineGlass className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-serif text-base text-foreground">Aucun vin trouve</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery.trim()
                ? 'Aucun vin trouve pour cette recherche.'
                : 'Aucun vin ne correspond aux filtres selectionnes.'}
            </p>
          </div>
        )}

        {filtered.map((wine, i) => (
          <WineCard key={`${wine.wine_name}-${wine.millesime_year}-${i}`} wine={wine} />
        ))}
      </div>

      {/* Archived wines section */}
      {archivedWines.length > 0 && (
        <>
          <div className="mt-6 border-t border-cave-border" />
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="mx-4 mt-4 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <span>Cave archivée ({archivedWines.length})</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showArchived ? 'rotate-180' : ''}`}
            />
          </button>

          {showArchived && (
            <div className="mt-2 flex flex-col gap-2.5 px-4 pb-4">
              {archivedWines.map((wine, i) => (
                <div key={`archived-${wine.wine_name}-${wine.millesime_year}-${i}`} className="relative">
                  <WineCard wine={wine} />
                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
                      Archivé
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
