"use client"

import { useMemo, useState } from "react"
import { Wine, GlassWater, Sparkles, Clock, Plus, Lightbulb, Sparkle, ChevronRight } from "lucide-react"
import { CaveBadge } from "./cave-badge"
import { AddWineSheet } from "./add-wine-sheet"
import { getApogee } from "@/data/apogee"
import { getDailyTip } from "@/data/wine-tips"
import type { Wine as WineType } from "@/data/apogee"
import type { TabId } from "./bottom-nav"
import type { CaveListProps } from "./cave-list"
import { sanitizeWineName } from "@/lib/wine-helpers"
import { useStockOverrides } from "@/hooks/use-stock-overrides"

interface DashboardProps {
  cave: WineType[]
  onNavigate: (tab: TabId, filter?: CaveListProps["initialFilter"]) => void
  onAddWine: (wine: WineType) => void
}

export function Dashboard({ cave, onNavigate, onAddWine }: DashboardProps) {
  const [showAddSheet, setShowAddSheet] = useState(false)
  const { getOverride } = useStockOverrides()
  const tip = getDailyTip()

  const stats = useMemo(() => {
    const active = cave.filter((w) => {
      const o = getOverride(w.wine_name, w.millesime_year)
      return !o?.deleted && !o?.archived
    })

    const total = active.reduce((s, w) => s + (Number(w.bottle_quantity) || 0), 0)
    const reds = active.filter((w) => w.wine_type === "wine_red" || w.wine_color === "Rouge")
      .reduce((s, w) => s + (Number(w.bottle_quantity) || 0), 0)
    const whites = active.filter((w) => w.wine_type === "wine_white" || w.wine_color === "Blanc")
      .reduce((s, w) => s + (Number(w.bottle_quantity) || 0), 0)
    const sparkling = active.filter((w) =>
      w.wine_type === "wine_white_sparkling" || w.wine_color === "Petillant" || w.wine_color === "Effervescent"
    ).reduce((s, w) => s + (Number(w.bottle_quantity) || 0), 0)

    const toDrink = active.filter((w) => {
      const a = getApogee(w)
      return a && (a.st === "urgent" || a.st === "late")
    })

    const recent = active.filter((w) => (w as any)._manual).slice(0, 3)

    return { total, reds, whites, sparkling, toDrink, recent }
  }, [cave, getOverride])

  return (
    <div className="pb-24">
      <div style={{ paddingTop: "env(safe-area-inset-top, 0px)" }} />

      {/* Tip du jour */}
      <div className="mx-4 mt-4 rounded-xl border border-cave-border bg-card overflow-hidden">
        <div className={`flex items-center gap-2 px-3.5 pt-3 pb-1.5 ${tip.type === "personal" ? "text-primary" : "text-muted-foreground"}`}>
          {tip.type === "personal" ? (
            <Sparkle className="h-3.5 w-3.5 shrink-0 text-primary" />
          ) : (
            <Lightbulb className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="text-[10px] font-semibold uppercase tracking-widest">
            {tip.type === "personal" ? "Votre cave" : "Le saviez-vous ?"}
          </span>
        </div>
        <p className="px-3.5 pb-3.5 text-sm leading-relaxed text-foreground">{tip.text}</p>
      </div>

      {/* Snapshot cave */}
      <button
        onClick={() => onNavigate("liste")}
        className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center justify-between rounded-xl border border-cave-border bg-card px-3.5 py-3 transition-colors hover:border-primary/30"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Wine className="h-4 w-4 text-primary" />
            <span className="font-serif text-lg font-semibold text-foreground">{stats.total}</span>
            <span className="text-xs text-muted-foreground">bouteilles</span>
          </div>
          {stats.reds > 0 && (
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-xs text-muted-foreground">{stats.reds}</span>
            </div>
          )}
          {stats.whites > 0 && (
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-200" />
              <span className="text-xs text-muted-foreground">{stats.whites}</span>
            </div>
          )}
          {stats.sparkling > 0 && (
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-sky-300" />
              <span className="text-xs text-muted-foreground">{stats.sparkling}</span>
            </div>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* A boire maintenant */}
      {stats.toDrink.length > 0 && (
        <section className="mt-5 px-4">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-foreground">A boire maintenant</h2>
            </div>
            {stats.toDrink.length > 3 && (
              <button onClick={() => onNavigate("liste", { level: "drink" })} className="text-xs text-primary">
                Voir tout ({stats.toDrink.length})
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {stats.toDrink.slice(0, 3).map((wine, i) => {
              const apogee = getApogee(wine)
              return (
                <div key={`drink-${wine.wine_name}-${i}`} className="flex items-center justify-between rounded-lg border border-cave-border bg-card px-3 py-2.5">
                  <div className="flex-1 pr-3 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {sanitizeWineName(wine.wine_name) || sanitizeWineName(wine.wine_appellation) || "Vin inconnu"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {wine.millesime_year}{wine.wine_region ? ` · ${sanitizeWineName(wine.wine_region)}` : ""}
                    </p>
                  </div>
                  {apogee && (
                    <CaveBadge label={apogee.st === "urgent" ? "Urgent" : "Bientot"} variant={apogee.st === "urgent" ? "urgent" : "late"} />
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Ajouts recents */}
      {stats.recent.length > 0 && (
        <section className="mt-5 px-4">
          <div className="mb-2.5 flex items-center gap-2">
            <GlassWater className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Ajouts recents</h2>
          </div>
          <div className="flex flex-col gap-2">
            {stats.recent.map((wine, i) => (
              <div key={`recent-${wine.wine_name}-${i}`} className="flex items-center justify-between rounded-lg border border-cave-border bg-card px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {sanitizeWineName(wine.wine_name) || "Vin inconnu"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {wine.millesime_year}{wine.wine_region ? ` · ${sanitizeWineName(wine.wine_region)}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {stats.total === 0 && (
        <div className="mx-4 mt-6 rounded-xl border border-cave-border bg-card p-6 text-center">
          <p className="font-serif text-base text-foreground">Cave vide</p>
          <p className="mt-1 text-sm text-muted-foreground">Ajoutez votre premiere bouteille pour commencer.</p>
          <button
            onClick={() => setShowAddSheet(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Ajouter un vin
          </button>
        </div>
      )}

      {/* FAB + */}
      <button
        onClick={() => setShowAddSheet(true)}
        className="fixed bottom-[calc(80px+env(safe-area-inset-bottom,0px))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
        aria-label="Ajouter un vin"
      >
        <Plus className="h-6 w-6" />
      </button>

      <AddWineSheet isOpen={showAddSheet} onOpenChange={setShowAddSheet} onAdd={onAddWine} />
    </div>
  )
}
