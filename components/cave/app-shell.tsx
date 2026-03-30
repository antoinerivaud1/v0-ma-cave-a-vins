"use client"

import { useState, useCallback } from "react"
import { BottomNav, type TabId } from "./bottom-nav"
import { Dashboard } from "./dashboard"
import { CaveList } from "./cave-list"
import type { CaveListProps } from "./cave-list"
import { TastingScreen } from "./tasting-screen"
import { Suggest } from "./suggest"
import { Settings } from "./settings"
import type { Wine } from "@/data/apogee"

interface AppShellProps {
  cave: Wine[]
  lastUpdated: string | null
  onImport: (data: Wine[]) => void
  onClear: () => void
  onAddWine: (wine: Wine) => void
}

export function AppShell({ cave, lastUpdated, onImport, onClear, onAddWine }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<TabId>("cave")
  const [listFilter, setListFilter] = useState<CaveListProps["initialFilter"]>(undefined)

  const navigateTo = useCallback((tab: TabId, filter?: CaveListProps["initialFilter"]) => {
    setListFilter(tab === "liste" ? filter : undefined)
    setActiveTab(tab)
  }, [])

  return (
    <div className="mx-auto min-h-dvh max-w-[480px]" style={{ paddingBottom: "calc(76px + env(safe-area-inset-bottom, 20px))" }}>
      {activeTab === "cave" && <Dashboard cave={cave} onNavigate={navigateTo} onAddWine={onAddWine} />}
      {activeTab === "carnet" && <TastingScreen />}
      {activeTab === "liste" && <CaveList cave={cave} initialFilter={listFilter} onAddWine={onAddWine} />}
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
    </div>
  )
}
