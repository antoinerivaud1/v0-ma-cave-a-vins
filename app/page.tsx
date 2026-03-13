"use client"

import { useCallback } from "react"
import { useCave } from "@/hooks/use-cave"
import { useManualWines } from "@/hooks/use-manual-wines"
import { Onboarding } from "@/components/cave/onboarding"
import { AppShell } from "@/components/cave/app-shell"
import type { Wine } from "@/data/apogee"

export default function Page() {
  const { cave, saveCave, clearCave, lastUpdated, isLoaded } = useCave()
  const { manualWines, isLoaded: manualLoaded, addWine, clearManualWines } = useManualWines()

  const handleImport = useCallback(
    (data: Wine[]) => { saveCave(data) },
    [saveCave]
  )

  const handleClear = useCallback(() => {
    clearCave()
    clearManualWines()
  }, [clearCave, clearManualWines])

  if (!isLoaded || !manualLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const allWines = [...manualWines, ...cave]

  if (allWines.length === 0) {
    return <Onboarding onImport={handleImport} onAddManual={addWine} />
  }

  return (
    <AppShell
      cave={allWines}
      lastUpdated={lastUpdated}
      onImport={handleImport}
      onClear={handleClear}
      onAddWine={addWine}
    />
  )
}
