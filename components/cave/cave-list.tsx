"use client"

import { useMemo, useState } from "react"
import { Search, X, Wine as WineGlass, ChevronDown, Plus, ChevronRight } from "lucide-react"
import { AddWineSheet } from "./add-wine-sheet"
import { FilterBar } from "./filter-bar"
import { SortFilterDropdown, type SortFilterState } from "./sort-filter-dropdown"
import { WineCard } from "./wine-card"
import { WineBottleThumb } from "@/components/cave/wine-bottle-thumb"
import { useStockOverrides } from "@/hooks/use-stock-overrides"
import { getEffectiveWineState } from "@/lib/stock-overrides"
import { formatRegion, sanitizeWineName } from "@/lib/wine-helpers"
import { getApogee } from "@/data/apogee"
import type { Wine } from "@/data/apogee"
import type { WineEnrichment } from "@/app/api/enrich-wine/route"

const WINE_TYPE_LABELS: Record<string, string> = {
  wine_red: "Rouge",
  wine_white: "Blanc",
  wine_white_sparkling: "Pétillant",
  wine_rose: "Rosé",
}

const APOGEE_BADGE: Record<string, { label: string; className: string }> = {
  urgent: { label: "⏰ À boire", className: "bg-red-50 text-red-700" },
  late: { label: "🔴 Trop tard", className: "bg-red-100 text-red-800" },
  ok: { label: "🍃 En forme", className: "bg-green-50 text-green-700" },
  wait: { label: "⏳ Attendre", className: "bg-yellow-50 text-yellow-700" },
}

const COLOR_FILTERS = [
  { key: "all", label: "Tous" },
  { key: "wine_red", label: "🍷 Rouge" },
  { key: "wine_white", label: "🥂 Blanc" },
  { key: "wine_white_sparkling", label: "✨ Petillant" },
]

const LEVEL_FILTERS = [
  { key: "all", label: "Tous" },
  { key: "exceptional", label: "⭐ Exceptionnels" },
  { key: "drink", label: "⏰ A boire" },
]

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function isExceptional(wine: Wine): boolean {
  const apogee = getApogee(wine)
  const year = parseInt(String(wine.millesime_year))
  return !!(apogee && apogee.st === "ok" && !Number.isNaN(year) && year <= 2015)
}

function isDrinkNow(wine: Wine): boolean {
  const apogee = getApogee(wine)
  return !!(apogee && (apogee.st === "urgent" || apogee.st === "late"))
}

function normalizeForSort(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function compareApogee(a: Wine, b: Wine, dir: "asc" | "desc"): number {
  const statusOrder = { urgent: 0, late: 1, ok: 2, wait: 3 }
  const aStatus = getApogee(a)?.st || "wait"
  const bStatus = getApogee(b)?.st || "wait"
  const comparison = statusOrder[aStatus as keyof typeof statusOrder] - statusOrder[bStatus as keyof typeof statusOrder]
  return dir === "asc" ? comparison : -comparison
}

export interface CaveListProps {
  cave: Wine[]
  onAddWine?: (wine: Wine) => void
  onWineSelect?: (wine: Wine) => void
  initialFilter?: { color?: string; level?: string }
}

export function CaveList({ cave, initialFilter, onAddWine, onWineSelect }: CaveListProps) {
  const [colorFilter, setColorFilter] = useState(initialFilter?.color || "all")
  const [levelFilter, setLevelFilter] = useState(initialFilter?.level || "all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortFilterState, setSortFilterState] = useState<SortFilterState>({
    millesimeSort: null,
    selectedRegions: [],
    apogeeSort: null,
  })
  const [showArchived, setShowArchived] = useState(false)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const { getOverrideForWine, isLoaded } = useStockOverrides()

  const filtered = useMemo(() => {
    if (!isLoaded) return []

    let result = cave.filter((wine) => getEffectiveWineState(wine, getOverrideForWine(wine)).isVisible)

    if (searchQuery.trim()) {
      const query = normalize(searchQuery.trim())
      result = result.filter((wine) => {
        const name = normalize(String(wine.wine_name || ""))
        const region = normalize(formatRegion(String(wine.wine_region || "")))
        const rawRegion = normalize(String(wine.wine_region || ""))
        const cepage = normalize(String(wine.wine_classification || ""))
        const millesime = String(wine.millesime_year || "")
        return (
          name.includes(query) ||
          region.includes(query) ||
          rawRegion.includes(query) ||
          cepage.includes(query) ||
          millesime.includes(query)
        )
      })
    }

    if (colorFilter !== "all") {
      result = result.filter((wine) => wine.wine_type === colorFilter)
    }

    if (levelFilter === "exceptional") {
      result = result.filter(isExceptional)
    } else if (levelFilter === "drink") {
      result = result.filter(isDrinkNow)
    }

    if (sortFilterState.selectedRegions.length > 0) {
      result = result.filter((wine) => {
        const wineRegion = normalizeForSort(String(wine.wine_region || ""))
        return sortFilterState.selectedRegions.some((region) => normalizeForSort(region) === wineRegion)
      })
    }

    if (sortFilterState.millesimeSort) {
      result = [...result].sort((a, b) => {
        const aYear = parseInt(String(a.millesime_year)) || 0
        const bYear = parseInt(String(b.millesime_year)) || 0
        const comparison = aYear - bYear
        return sortFilterState.millesimeSort === "asc" ? comparison : -comparison
      })
    }

    if (sortFilterState.apogeeSort) {
      const apogeeDirection = sortFilterState.apogeeSort
      result = [...result].sort((a, b) => compareApogee(a, b, apogeeDirection))
    }

    return result
  }, [cave, colorFilter, levelFilter, searchQuery, sortFilterState, isLoaded, getOverrideForWine])

  const archivedWines = useMemo(() => {
    if (!isLoaded) return []

    return cave.filter((wine) => {
      const effectiveState = getEffectiveWineState(wine, getOverrideForWine(wine))
      return effectiveState.archived && !effectiveState.deleted
    })
  }, [cave, isLoaded, getOverrideForWine])

  const totalBottles = useMemo(() => {
    return filtered.reduce((sum, wine) => {
      return sum + getEffectiveWineState(wine, getOverrideForWine(wine)).quantity
    }, 0)
  }, [filtered, getOverrideForWine])

  return (
    <div className="pb-4">
      <div className="flex items-start justify-between px-4" style={{ paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))" }}>
        <div className="pb-2">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Mes Vins</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            <span className="font-sans font-semibold tabular-nums">{totalBottles}</span>
            {" "}bouteille{totalBottles !== 1 ? "s" : ""}
          </p>
        </div>
        {onAddWine && (
          <button
            onClick={() => setShowAddSheet(true)}
            className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-95"
            aria-label="Ajouter un vin"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="sticky top-0 z-20 bg-background/80 px-4 pb-2 pt-1 backdrop-blur-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Rechercher un vin, region, cepage, millesime..."
            className="h-10 w-full rounded-lg border border-cave-border bg-card pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <FilterBar options={COLOR_FILTERS} activeKey={colorFilter} onSelect={setColorFilter} />
      <FilterBar options={LEVEL_FILTERS} activeKey={levelFilter} onSelect={setLevelFilter} />
      <SortFilterDropdown cave={cave} state={sortFilterState} onStateChange={setSortFilterState} />

      <div className="mt-2 flex flex-col gap-2.5 px-4">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-cave-border bg-card p-8 text-center">
            <WineGlass className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-serif text-base text-foreground">Aucun vin trouve</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery.trim()
                ? "Aucun vin trouve pour cette recherche."
                : "Aucun vin ne correspond aux filtres selectionnes."}
            </p>
          </div>
        )}

        {filtered.map((wine, index) => {
          const enrichment = wine.enrichissement as WineEnrichment | null
          const qty = getEffectiveWineState(wine, getOverrideForWine(wine)).quantity

          return (
            <div
              key={`${wine.wine_name}-${wine.millesime_year}-${index}`}
              className="bg-white rounded-2xl flex items-center gap-3 px-3 py-3 shadow-sm border border-gray-100 cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => onWineSelect?.(wine)}
            >
              <WineBottleThumb
                imageUrl={enrichment?.bottle_image_url ?? null}
                wineType={wine.wine_type}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-900 truncate">
                  {sanitizeWineName(wine.wine_name)}
                </div>
                <div className="text-xs text-gray-500 truncate mt-0.5">
                  {[wine.wine_domain, wine.wine_region].filter(Boolean).join(" · ")}
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {wine.wine_type && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                      {WINE_TYPE_LABELS[wine.wine_type] ?? wine.wine_type}
                    </span>
                  )}
                  {wine.millesime_year && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {String(wine.millesime_year)}
                    </span>
                  )}
                  {enrichment?.notes && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                      ★ {enrichment.notes}
                    </span>
                  )}
                  {(() => {
                    const apogee = getApogee(wine)
                    if (!apogee) return null

                    const badge = APOGEE_BADGE[apogee.st]
                    if (!badge) return null

                    return (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                        {badge.label}
                      </span>
                    )
                  })()}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-base font-black text-[#722F37]">{qty}</span>
                <span className="text-[10px] text-gray-400">bout.</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </div>
          )
        })}
      </div>

      {archivedWines.length > 0 && (
        <>
          <div className="mt-6 border-t border-cave-border" />
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="mx-4 mt-4 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <span>Cave archivée ({archivedWines.length})</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showArchived ? "rotate-180" : ""}`} />
          </button>

          {showArchived && (
            <div className="mt-2 flex flex-col gap-2.5 px-4 pb-4">
              {archivedWines.map((wine, index) => (
                <div key={`archived-${wine.wine_name}-${wine.millesime_year}-${index}`} className="relative">
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

      {onAddWine && (
        <AddWineSheet
          isOpen={showAddSheet}
          onOpenChange={setShowAddSheet}
          onAdd={onAddWine}
        />
      )}
    </div>
  )
}
