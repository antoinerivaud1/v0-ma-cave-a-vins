"use client"

import { Check } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { sanitizeWineName } from "@/lib/wine-helpers"
import type { Cave } from "@/hooks/use-caves"

interface CaveSwitchSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caves: Cave[]
  activeCaveId: string | null
  onSelectCave: (caveId: string) => void
}

export function CaveSwitchSheet({
  open,
  onOpenChange,
  caves,
  activeCaveId,
  onSelectCave,
}: CaveSwitchSheetProps) {
  const handleSelectCave = (caveId: string) => {
    onSelectCave(caveId)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-0 max-h-[90dvh] flex flex-col z-[60]">
        <SheetHeader className="px-5 pb-3">
          <SheetTitle className="font-serif text-lg">Mes caves</SheetTitle>
        </SheetHeader>
        <Separator />
        <ul
          className="overflow-y-auto flex-1 divide-y divide-cave-border"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {caves.map((cave) => {
            const isActive = cave.id === activeCaveId
            return (
              <li key={cave.id}>
                <button
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50"
                  onClick={() => handleSelectCave(cave.id)}
                >
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {sanitizeWineName(cave.name)}
                  </span>
                  {isActive && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
