"use client"

import { useMemo, useState } from "react"
import { Wine, GlassWater, Sparkles, Star, Clock, AlertTriangle, Plus } from "lucide-react"
import { PageHeader } from "./page-header"
import { CaveBadge } from "./cave-badge"
import { AddWineSheet } from "./add-wine-sheet"
import { getApogee } from "@/data/apogee"
import type { Wine as WineType } from "@/data/apogee"
import type { TabId } from "./bottom-nav"
import type { CaveListProps } from "./cave-list"
import { sanitizeWineName } from "@/lib/wine-helpers"

interface DashboardProps {
  cave: WineType[]
  onNavigate: (tab: TabId, filter?: CaveListProps["initialFilter"]) => void
  onAddWine: (wine: WineType) => void
}

interface StatCard {
  label: string
  value: number
  icon: React.ElementType
  color: string
}

function matchClassification(wine: WineType, ...tiers: string[]): boolean {
  const val = String(wine.wine_classification || "").toLowerCase().trim()
  return tiers.some((t) => val === t.toLowerCase().trim())
}

function isExceptional(wine: WineType): boolean {
  const a = getApogee(wine)
  const year = parseInt(String(wine.millesime_year))
  if (a && a.st === "ok" && !isNaN(year) && year <= 2015) return true
  return matchClassification(wine, "exceptionnel", "grand cru", "premier cru", "1er cru")
}

export function Dashboard({ cave, onNavigate, onAddWine }: DashboardProps) {
  const [showAddSheet, setShowAddSheet] = useState(false)

  const stats = useMemo(() => {
    const total = cave.reduce((sum, w) => sum + (Number(w.bottle_quantity) || 0), 0)
    const reds = cave
      .filter((w) => w.wine_type === "wine_red" || w.wine_color === "Rouge")
      .reduce((s, w) => s + (Number(w.bottle_quantity) || 0), 0)
    const whites = cave
      .filter((w) => w.wine_type === "wine_white" || w.wine_color === "Blanc")
      .reduce((s, w) => s + (Number(w.bottle_quantity) || 0), 0)
    const sparkling = cave
      .filter((w) => w.wine_type === "wine_white_sparkling" || w.wine_color === "Petillant" || w.wine_color === "Effervescent")
      .reduce((s, w) => s + (Number(w.bottle_quantity) || 0), 0)
    const exceptional = cave
      .filter(isExceptional)
      .reduce((s, w) => s + (Number(w.bottle_quantity) || 0), 0)
    const toDrink = cave.filter((w) => {
      const a = getApogee(w)
      return a && (a.st === "urgent" || a.st === "late")
    })
    return { total, reds, whites, sparkling, exceptional, toDrink }
  }, [cave])

  const cards: (StatCard & { filter?: CaveListProps["initialFilter"] })[] = [
    { label: "Bouteilles", value: stats.total, icon: Wine, color: "text-primary" },
    { label: "Rouges", value: stats.reds, icon: Wine, color: "text-red-400", filter: { color: "wine_red" } },
    { label: "Blancs", value: stats.whites, icon: GlassWater, color: "text-amber-200", filter: { color: "wine_white" } },
    { label: "Petillants", value: stats.sparkling, icon: Sparkles, color: "text-sky-300", filter: { color: "wine_white_sparkling" } },
    { label: "Exceptionnels", value: stats.exceptional, icon: Star, color: "text-primary", filter: { level: "exceptional" } },
    { label: "A boire", value: stats.toDrink.length, icon: Clock, color: "text-amber-400", filter: { level: "drink" } },
  ]

  return (
    <div className="pb-4">
      {/* Header with + button */}
      <div className="flex items-start justify-between px-4" style={{ paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))" }}>
        <div className="pb-2">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Ma Cave</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{stats.total} bouteilles au total</p>
        </div>
        <button
          onClick={() => setShowAddSheet(true)}
          className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-95"
          aria-label="Ajouter un vin"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-3">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={() => onNavigate("liste", card.filter)}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-cave-border bg-card p-3 transition-colors hover:border-primary/30"
          >
            <card.icon className={`h-5 w-5 ${card.color}`} />
            <span className="font-serif text-2xl font-semibold text-foreground">{card.value}</span>
            <span className="text-xs text-muted-foreground">{card.label}</span>
          </button>
        ))}
      </div>

      {/* A ne pas oublier */}
      {stats.toDrink.length > 0 && (
        <section className="mt-6 px-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-foreground">A ne pas oublier</h2>
          </div>
          <div className="flex flex-col gap-2">
            {stats.toDrink.slice(0, 5).map((wine, i) => {
              const apogee = getApogee(wine)
              return (
                <div
                  key={`${wine.wine_name}-${i}`}
                  className="flex items-center justify-between rounded-lg border border-cave-border bg-card px-3 py-2.5"
                >
                  <div className="flex-1 pr-3">
                    <p className="text-sm font-medium text-foreground">
                      {sanitizeWineName(wine.wine_name) || sanitizeWineName(wine.wine_appellation) || "Vin inconnu"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {wine.millesime_year} {wine.wine_region ? `- ${sanitizeWineName(wine.wine_region)}` : ""}
                    </p>
                  </div>
                  {apogee && (
                    <CaveBadge
                      label={apogee.st === "urgent" ? "Urgent" : "Bientot"}
                      variant={apogee.st === "urgent" ? "urgent" : "late"}
                    />
                  )}
                </div>
              )
            })}
            {stats.toDrink.length > 5 && (
              <button
                onClick={() => onNavigate("liste", { level: "drink" })}
                className="py-1 text-center text-xs text-primary"
              >
                Voir les {stats.toDrink.length - 5} autres...
              </button>
            )}
          </div>
        </section>
      )}

      {stats.toDrink.length === 0 && stats.total > 0 && (
        <section className="mt-6 px-4">
          <div className="rounded-xl border border-cave-border bg-card p-6 text-center">
            <p className="font-serif text-base text-foreground">Tout va bien !</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Aucun vin ne necessite votre attention immediate.
            </p>
          </div>
        </section>
      )}

      <AddWineSheet
        isOpen={showAddSheet}
        onOpenChange={setShowAddSheet}
        onAdd={onAddWine}
      />
    </div>
  )
}
