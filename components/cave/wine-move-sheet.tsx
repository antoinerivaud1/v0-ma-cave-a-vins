"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"
import { useCaves } from "@/hooks/use-caves"
import { sanitizeWineName } from "@/lib/wine-helpers"

export interface SupabaseWine {
  id: string
  cave_id: string | null
  name: string
  vintage?: string | null
}

interface WineMoveSheetProps {
  wine: SupabaseWine
  open: boolean
  onOpenChange: (open: boolean) => void
  onMoved: () => void
}

export function WineMoveSheet({ wine, open, onOpenChange, onMoved }: WineMoveSheetProps) {
  const { user } = useAuth()
  const { caves, activeCaveId, moveWine } = useCaves()
  const [movingTo, setMovingTo] = useState<string | null>(null)

  const availableCaves = caves.filter((c) => c.id !== wine.cave_id)

  const handleMove = async (targetCaveId: string) => {
    if (!user) return
    if (movingTo) return
    setMovingTo(targetCaveId)
    try {
      await moveWine(wine.id, targetCaveId)
      const targetCave = caves.find((c) => c.id === targetCaveId)
      toast.success(
        `${sanitizeWineName(wine.name) || "Vin"} déplacé vers ${sanitizeWineName(targetCave?.name ?? "") || "la cave"}`
      )
      onMoved()
      onOpenChange(false)
    } catch {
      toast.error("Erreur lors du déplacement. Veuillez réessayer.")
    } finally {
      setMovingTo(null)
    }
  }

  const renderContent = () => {
    if (!user) {
      return (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          Connectez-vous pour déplacer des vins entre caves
        </div>
      )
    }

    if (caves.length <= 1) {
      return (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          Créez une autre cave dans les réglages pour pouvoir déplacer des vins
        </div>
      )
    }

    if (availableCaves.length === 0) {
      return (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          Ce vin est déjà dans la seule autre cave disponible
        </div>
      )
    }

    return (
      <ul className="divide-y divide-cave-border">
        {availableCaves.map((cave) => {
          const isActive = cave.id === activeCaveId
          const isMoving = movingTo === cave.id

          return (
            <li key={cave.id}>
              <button
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50 disabled:opacity-60"
                onClick={() => handleMove(cave.id)}
                disabled={!!movingTo}
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    isActive
                      ? "bg-cave-bordeaux"
                      : "border border-muted-foreground/30 bg-transparent"
                  }`}
                />
                <span className="flex-1 text-sm font-medium text-foreground">
                  {sanitizeWineName(cave.name)}
                </span>
                {isActive && (
                  <span className="text-xs text-cave-bordeaux">Active</span>
                )}
                {isMoving && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90dvh] flex flex-col rounded-t-2xl px-0 pb-0 z-[60]">
        <SheetHeader
          className="px-5 pb-3"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
        >
          <SheetTitle className="font-serif text-lg">Déplacer vers...</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {sanitizeWineName(wine.name) || "Vin"}
            {wine.vintage ? ` · ${wine.vintage}` : ""}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div
          className="overflow-y-auto flex-1"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {renderContent()}
        </div>
      </SheetContent>
    </Sheet>
  )
}
