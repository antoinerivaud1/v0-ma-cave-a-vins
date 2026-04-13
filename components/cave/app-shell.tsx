"use client"

import { useState, useCallback } from "react"
import { BottomNav, type TabId } from "./bottom-nav"
import { Dashboard } from "./dashboard"
import { CaveList } from "./cave-list"
import type { CaveListProps } from "./cave-list"
import { WineDetailSheet } from "./wine-detail-sheet"
import { WineMoveSheet } from "./wine-move-sheet"
import { CaveSwitchSheet } from "./cave-switch-sheet"
import { TastingScreen } from "./tasting-screen"
import { Suggest } from "./suggest"
import { Settings } from "./settings"
import type { Cave } from "@/hooks/use-caves"
import { useAuth } from "@/hooks/use-auth"
import { useStockOverrides } from "@/hooks/use-stock-overrides"
import { sanitizeWineName } from "@/lib/wine-helpers"
import type { Wine } from "@/data/apogee"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AppShellProps {
  cave: Wine[]
  lastUpdated: string | null
  isOfflineCache?: boolean
  onImport: (data: Wine[]) => void
  onClear: () => void | Promise<void>
  onAddWine: (wine: Wine) => void
  onReload?: () => void | Promise<void>
  activeCave: Cave | null
  caveCount: number
  caves: Cave[]
  activeCaveId: string | null
  setActiveCave: (id: string) => Promise<void>
}

export function AppShell({ cave, lastUpdated, isOfflineCache, onImport, onClear, onAddWine, onReload, activeCave, caveCount, caves, activeCaveId, setActiveCave }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<TabId>("cave")
  const [listFilter, setListFilter] = useState<CaveListProps["initialFilter"]>(undefined)
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null)
  const [moveSheetOpen, setMoveSheetOpen] = useState(false)
  const [showLastBottleDialog, setShowLastBottleDialog] = useState(false)
  const [caveSwitchOpen, setCaveSwitchOpen] = useState(false)
  const { getOverrideForWine, setOverrideForWine } = useStockOverrides()
  const { isPremium } = useAuth()
  const canMoveSelectedWine = !!selectedWine?.id && caveCount > 1

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
      {activeTab === "cave" && (
        <Dashboard
          cave={cave}
          onNavigate={navigateTo}
          onAddWine={onAddWine}
          activeCave={activeCave}
          caveCount={caveCount}
          onCaveSwitch={isPremium ? () => setCaveSwitchOpen(true) : undefined}
        />
      )}
      {activeTab === "carnet" && <TastingScreen />}
      {activeTab === "liste" && <CaveList cave={cave} initialFilter={listFilter} onAddWine={onAddWine} onWineSelect={setSelectedWine} onWineMove={onReload} />}
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
            if (currentQty <= 1) {
              setShowLastBottleDialog(true)
              return
            }
            setOverrideForWine(selectedWine, { ...override, quantity: currentQty - 1 })
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

      {selectedWine && (
        <AlertDialog open={showLastBottleDialog} onOpenChange={setShowLastBottleDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Dernière bouteille</AlertDialogTitle>
              <AlertDialogDescription>
                Vous avez consommé votre dernière bouteille de{" "}
                {sanitizeWineName(selectedWine.wine_name) || "ce vin"}.
                Que souhaitez-vous faire ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const override = getOverrideForWine(selectedWine)
                  setOverrideForWine(selectedWine, { ...override, quantity: 0, archived: true })
                  setShowLastBottleDialog(false)
                }}
                className="bg-muted text-foreground hover:bg-muted/80"
              >
                Archiver
              </AlertDialogAction>
              <AlertDialogAction
                onClick={() => {
                  const override = getOverrideForWine(selectedWine)
                  setOverrideForWine(selectedWine, { ...override, quantity: 0, deleted: true })
                  setShowLastBottleDialog(false)
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

      <CaveSwitchSheet
        open={caveSwitchOpen}
        onOpenChange={setCaveSwitchOpen}
        caves={caves}
        activeCaveId={activeCaveId}
        onSelectCave={(id) => {
          void setActiveCave(id)
        }}
      />
    </div>
  )
}
