"use client"

import { useState, useCallback } from "react"
import { BottomNav, type TabId } from "./bottom-nav"
import { Dashboard } from "./dashboard"
import { CaveList } from "./cave-list"
import type { CaveListProps } from "./cave-list"
import { WineDetailSheet } from "./wine-detail-sheet"
import { WineMoveSheet } from "./wine-move-sheet"
import { TastingScreen } from "./tasting-screen"
import { Suggest } from "./suggest"
import { Settings } from "./settings"
import { useCaves } from "@/hooks/use-caves"
import { useStockOverrides } from "@/hooks/use-stock-overrides"
import type { Wine } from "@/data/apogee"

interface AppShellProps {
  cave: Wine[]
  lastUpdated: string | null
  isOfflineCache?: boolean
  onImport: (data: Wine[]) => void
  onClear: () => void | Promise<void>
  onAddWine: (wine: Wine) => void
  onReload?: () => void | Promise<void>
}

export function AppShell({ cave, lastUpdated, isOfflineCache, onImport, onClear, onAddWine, onReload }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<TabId>("cave")
  const [listFilter, setListFilter] = useState<CaveListProps["initialFilter"]>(undefined)
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null)
  const [moveSheetOpen, setMoveSheetOpen] = useState(false)
  const { caves } = useCaves()
  const { getOverrideForWine, setOverrideForWine } = useStockOverrides()
  const canMoveSelectedWine = !!selectedWine?.id && caves.length > 1

  const navigateTo = useCallback((tab: TabId, filter?: CaveListProps["initialFilter"]) => {
    setListFilter(tab === "liste" ? filter : undefined)
    setActiveTab(tab)
  }, [])

  return (
    <div className="mx-auto min-h-dvh max-w-[480px]" style={{ paddingBottom: "calc(76px + env(safe-area-inset-bottom, 20px))" }}>
      {isOfflineCache && (
        <div
          className="sticky top-0 z-[60] bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 text-center"
          style={{ paddingTop: "calc(0.5rem + env(safe-area-inset-top, 0px))" }}
        >
          📶 Mode hors ligne — données mises en cache — les modifications sont désactivées
        </div>
      )}
      {activeTab === "cave" && <Dashboard cave={cave} onNavigate={navigateTo} onAddWine={onAddWine} />}
      {activeTab === "carnet" && <TastingScreen />}
      {activeTab === "liste" && <CaveList cave={cave} initialFilter={listFilter} onAddWine={onAddWine} onWineSelect={setSelectedWine} />}
      {activeTab === "accords" && <Suggest cave={cave} />}
      {activeTab === "reglages" && (
        <Settings
          cave={cave}
          lastUpdated={lastUpdated}
          onImport={onImport}
          onClear={onClear}
        />
      )}
      <BottomNav activeTab={activeTab} onTabChange={(tab) => navigateTo(tab)} />

      {/* WineDetailSheet rendu au niveau AppShell — hors du backdrop-filter de CaveList */}
      {selectedWine && (
        <WineDetailSheet
          wine={selectedWine}
          onClose={() => setSelectedWine(null)}
          onConsume={() => {
            if (isOfflineCache) return
            const override = getOverrideForWine(selectedWine)
            const currentQty = override?.quantity ?? Number(selectedWine.bottle_quantity ?? 0)
            const newQty = Math.max(0, currentQty - 1)
            setOverrideForWine(selectedWine, { ...override, quantity: newQty })
          }}
          onActionsOpen={() => {
            if (canMoveSelectedWine) {
              setMoveSheetOpen(true)
              return
            }
            setSelectedWine(null)
          }}
          myRating={null}
          actionsLabel={canMoveSelectedWine ? "Déplacer" : "Fermer"}
        />
      )}

      {selectedWine?.id && (
        <WineMoveSheet
          wine={{
            id: selectedWine.id,
            cave_id: selectedWine.cave_id ?? null,
            name: selectedWine.wine_name ?? "Vin inconnu",
            vintage: selectedWine.millesime_year ? String(selectedWine.millesime_year) : null,
          }}
          open={moveSheetOpen}
          onOpenChange={setMoveSheetOpen}
          onMoved={() => {
            setMoveSheetOpen(false)
            setSelectedWine(null)
            void onReload?.()
          }}
        />
      )}
    </div>
  )
}
