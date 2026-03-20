"use client"
import { useState, useCallback } from "react"
import { useCave } from "@/hooks/use-cave"
import { useManualWines } from "@/hooks/use-manual-wines"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/cave/app-shell"
import { AuthSheet } from "@/components/cave/auth-sheet"
import { Button } from "@/components/ui/button"
import type { Wine } from "@/data/apogee"
export default function Page() {
  const { user, loading: authLoading } = useAuth()
  const { cave, saveCave, clearCave, lastUpdated, isLoaded } = useCave()
  const { manualWines, isLoaded: manualLoaded, addWine, clearManualWines } = useManualWines()
  const [authSheetOpen, setAuthSheetOpen] = useState(false)
  const handleImport = useCallback(
    (data: Wine[]) => { saveCave(data) },
    [saveCave]
  )
  const handleClear = useCallback(() => {
    clearCave()
    clearManualWines()
  }, [clearCave, clearManualWines])
  // Spinner pendant le chargement de l'auth et des données localStorage
  if (authLoading || !isLoaded || !manualLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }
  // Mur d'auth : utilisateur non connecté
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
  // Utilisateur connecté → AppShell (cave vide ou non)
  const allWines = [...manualWines, ...cave]
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
