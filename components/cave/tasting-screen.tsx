"use client"

import { useState } from "react"
import { useTastings } from "@/hooks/use-tastings"
import { TastingStats } from "./tasting-stats"
import { TastingCard } from "./tasting-card"
import { TastingSheet } from "./tasting-sheet"
import { BookOpen } from "lucide-react"
import type { TastingInput } from "@/hooks/use-tastings"

export function TastingScreen() {
  const { listTastings, saveTasting, isLoaded } = useTastings()
  const [sheetOpen, setSheetOpen] = useState(false)

  const tastings = listTastings()

  const handleSave = async (input: TastingInput) => {
    await saveTasting(input)
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <TastingStats tastings={tastings} />

      <div className="flex-1 px-4 py-4">
        {tastings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <BookOpen className="h-12 w-12 text-muted-foreground/30" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aucune dégustation</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Notez vos vins depuis leur fiche ou avec le bouton ci-dessous
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Dernières dégustations
            </p>
            {tastings.map((tasting) => (
              <TastingCard key={tasting.id} tasting={tasting} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-[calc(76px+env(safe-area-inset-bottom,20px)+12px)] right-4 flex items-center gap-2 rounded-full bg-cave-bordeaux px-4 py-3 text-sm font-semibold text-white shadow-lg z-40"
        style={{ boxShadow: "0 4px 20px rgba(114,47,55,0.4)" }}
      >
        + Nouvelle dégustation
      </button>

      <TastingSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleSave}
      />
    </div>
  )
}
