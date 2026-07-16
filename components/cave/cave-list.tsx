"use client"

import { useMemo, useState } from "react"
import { Search, X, ChevronDown, Plus } from "lucide-react"
import { AddWineSheet } from "./add-wine-sheet"
import { FilterBar } from "./filter-bar"
import { SortFilterDropdown, type SortFilterState } from "./sort-filter-dropdown"
import { WineCard } from "./wine-card"
import { FilterPill } from "./synthese/filter-pill"
import { BigTile } from "./synthese/big-tile"
import { useStockOverrides } from "@/hooks/use-stock-overrides"
import { useCaves } from "@/hooks/use-caves"
import { getEffectiveWineState } from "@/lib/stock-overrides"
import { formatRegion } from "@/lib/wine-helpers"
import { getUnifiedApogee, unifiedToLegacySt } from "@/lib/apogee-unified"
import { useWineEnrichmentsBatch } from "@/hooks/use-wine-enrichment"
import type { Wine } from "@/data/apogee"
import type { WineEnrichment } from "@/lib/types"

const COLOR_FILTERS = [
  { key: "all", label: "Tous" },
  { key: "wine_red", label: "Rouges" },
  { key: "wine_white", label: "Blancs" },
  { key: "wine_white_sparkling", label: "Bulles" },
  { key: "wine_rose", label: "Rosés" },
]

const LEVEL_FILTERS = [
  { key: "all", label: "Tous" },
  { key: "exceptional", label: "Exceptionnels" },
  { key: "drink", label: "À boire" },
]

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

function isExceptional(wine: Wine, enrichment?: WineEnrichment | null): boolean {
  const unified = getUnifiedApogee(wine, enrichment ?? null)
  const year = parseInt(String(wine.millesime_year))
  return !!(unified && unifiedToLegacySt(unified) === "ok" && !Number.isNaN(year) && year <= 2015)
}

function isDrinkNow(wine: Wine, enrichment?: WineEnrichment | null): boolean {
  const unified = getUnifiedApogee(wine, enrichment ?? null)
  if (!unified) return false
  const legacySt = unifiedToLegacySt(unified)
  return legacySt === "urgent" || legacySt === "late"
}

function normalizeForSort(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

function compareApogee(
  a: Wine,
  b: Wine,
  dir: "asc" | "desc",
  enrichMap: Map<string, WineEnrichment>
): number {
  const statusOrder = { urgent: 0, late: 1, ok: 2, wait: 3 }
  const aUnified = getUnifiedApogee(a, a.id ? enrichMap.get(a.id) ?? null : null)
  const bUnified = getUnifiedApogee(b, b.id ? enrichMap.get(b.id) ?? null : null)
  const aStatus = aUnified ? unifiedToLegacySt(aUnified) : "wait"
  const bStatus = bUnified ? unifiedToLegacySt(bUnified) : "wait"
  const comparison = statusOrder[aStatus as keyof typeof statusOrder] - statusOrder[bStatus as keyof typeof statusOrder]
  return dir === "asc" ? comparison : -comparison
}

export interface CaveListProps {
  cave: Wine[]
  onAddWine?: (wine: Wine) => void
  onWineSelect?: (wine: Wine) => void
  onWineMove?: () => void
  initialFilter?: { color?: string; level?: string }
}

export function CaveList({ cave, initialFilter, onAddWine, onWineSelect, onWineMove }: CaveListProps) {
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
  const { caves } = useCaves()
  const { map: enrichMap } = useWineEnrichmentsBatch(cave.map((w) => w.id))

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
      result = result.filter((wine) => isExceptional(wine, wine.id ? enrichMap.get(wine.id) : null))
    } else if (levelFilter === "drink") {
      result = result.filter((wine) => isDrinkNow(wine, wine.id ? enrichMap.get(wine.id) : null))
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
      result = [...result].sort((a, b) => compareApogee(a, b, apogeeDirection, enrichMap))
    }

    return result
  }, [cave, colorFilter, levelFilter, searchQuery, sortFilterState, isLoaded, getOverrideForWine, enrichMap])

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
      {/* Header kicker + title + count + add button */}
      <div
        className="flex items-start justify-between px-4"
        style={{ paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))" }}
      >
        <div className="pb-2">
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              marginBottom: 2,
            }}
          >
            {totalBottles} BOUTEILLE{totalBottles !== 1 ? "S" : ""}
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: 28,
              lineHeight: 1.05,
              color: "var(--ink)",
            }}
          >
            Mes Vins
          </h1>
        </div>
        {onAddWine && (
          <button
            onClick={() => setShowAddSheet(true)}
            style={{
              marginTop: 4,
              display: "flex",
              height: 36,
              width: 36,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: "var(--ink)",
              color: "var(--bg)",
              border: "var(--border-hard)",
              boxShadow: "var(--shadow-hard)",
              cursor: "pointer",
              flexShrink: 0,
            }}
            aria-label="Ajouter un vin"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="sticky top-0 z-20 px-4 pb-2 pt-1" style={{ background: "var(--bg)", backdropFilter: "blur(12px)" }}>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--ink-soft)" }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Rechercher un vin, region, cepage, millesime..."
            style={{
              height: 40,
              width: "100%",
              borderRadius: 12,
              border: "var(--border-hard)",
              background: "var(--paper-2)",
              paddingLeft: 36,
              paddingRight: 36,
              fontSize: 13,
              color: "var(--ink)",
              fontFamily: "var(--font-sans)",
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5"
              style={{ color: "var(--ink-soft)", cursor: "pointer", background: "none", border: "none" }}
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Color filter pills — Synthese v1 style */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          padding: "10px 0 6px",
          marginLeft: 0,
          paddingLeft: 16,
          paddingRight: 16,
          scrollbarWidth: "none",
        }}
      >
        {COLOR_FILTERS.map((f) => (
          <FilterPill
            key={f.key}
            label={f.label}
            active={colorFilter === f.key}
            onClick={() => setColorFilter(f.key)}
          />
        ))}
      </div>

      {/* Level filter — keep FilterBar for secondary filter */}
      <FilterBar options={LEVEL_FILTERS} activeKey={levelFilter} onSelect={setLevelFilter} />
      <SortFilterDropdown cave={cave} state={sortFilterState} onStateChange={setSortFilterState} />

      <div className="mt-2 flex flex-col gap-2.5 px-4">
        {filtered.length === 0 && (
          <BigTile
            bg="var(--paper-2)"
            fg="var(--ink)"
            shadow={false}
            style={{
              border: "2px dashed var(--ink-faint)",
              boxShadow: "none",
              textAlign: "center",
              padding: 32,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 20,
                color: "var(--ink)",
                marginBottom: 6,
              }}
            >
              Aucun vin trouve
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--ink-soft)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {searchQuery.trim()
                ? "Aucun vin trouve pour cette recherche."
                : "Aucun vin ne correspond aux filtres selectionnes."}
            </p>
          </BigTile>
        )}

        {filtered.map((wine, index) => (
          <WineCard
            key={`${wine.wine_name}-${wine.millesime_year}-${index}`}
            wine={wine}
            caves={caves}
            dbEnrichment={wine.id ? enrichMap.get(wine.id) : null}
            onWineSelect={onWineSelect}
            onMoved={onWineMove}
          />
        ))}
      </div>

      {archivedWines.length > 0 && (
        <>
          <div
            style={{
              marginTop: 24,
              borderTop: "var(--border-hard)",
            }}
          />
          <button
            onClick={() => setShowArchived(!showArchived)}
            style={{
              margin: "16px 16px 0",
              display: "flex",
              width: "calc(100% - 32px)",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 12,
              padding: "8px 12px",
              textAlign: "left",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--ink-soft)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            <span>Cave archivée ({archivedWines.length})</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showArchived ? "rotate-180" : ""}`}
            />
          </button>

          {showArchived && (
            <div className="mt-2 flex flex-col gap-2.5 px-4 pb-4">
              {archivedWines.map((wine, index) => (
                <div key={`archived-${wine.wine_name}-${wine.millesime_year}-${index}`} className="relative">
                  <WineCard wine={wine} caves={caves} dbEnrichment={wine.id ? enrichMap.get(wine.id) : null} />
                  <div className="absolute top-3 right-3 z-10">
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        fontSize: 11,
                        fontWeight: 600,
                        borderRadius: 6,
                        background: "var(--paper-2)",
                        color: "var(--ink-soft)",
                        border: "1.5px solid var(--ink-faint)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
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
