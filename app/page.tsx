"use client"
import { useState, useCallback } from "react"
import { useCloudCave } from "@/hooks/use-cloud-cave"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/cave/app-shell"
import { AuthSheet } from "@/components/cave/auth-sheet"
import { Button } from "@/components/ui/button"
import type { Wine } from "@/data/apogee"

export default function Page() {
  const { user, loading: authLoading } = useAuth()
  const {
    cave,
    importWines,
    clearCave,
    lastUpdated,
    isLoaded,
    isOfflineCache,
    addWine,
    reloadCave,
  } = useCloudCave()
  const [authSheetOpen, setAuthSheetOpen] = useState(false)

  const handleImport = useCallback(
    (data: Wine[]) => {
      if (isOfflineCache) return
      void importWines(data)
    },
    [importWines, isOfflineCache]
  )

  const handleClear = useCallback(() => {
    if (isOfflineCache) return
    void clearCave()
  }, [clearCave, isOfflineCache])

  if (authLoading || !isLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div
          className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6"
          style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 20px))" }}
        >
          <div className="text-center space-y-3">
            <h1 className="font-serif text-4xl font-medium">Ma Cave à Vins</h1>
            <p className="text-muted-foreground text-sm">
              Connectez-vous pour accéder à votre cave
            </p>
          </div>
          <Button
            onClick={() => setAuthSheetOpen(true)}
            className="w-full max-w-xs"
            size="lg"
          >
            Se connecter
          </Button>
        </div>
        <AuthSheet open={authSheetOpen} onOpenChange={setAuthSheetOpen} />
      </>
    )
  }

  return (
    <AppShell
      cave={cave}
      lastUpdated={lastUpdated}
      isOfflineCache={isOfflineCache}
      onImport={handleImport}
      onClear={handleClear}
      onAddWine={isOfflineCache ? () => {} : addWine}
      onReload={reloadCave}
    />
  )
}
