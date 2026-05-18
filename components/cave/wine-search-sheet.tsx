"use client"

import { useState } from "react"
import { ExternalLink } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { sanitizeWineName } from "@/lib/wine-helpers"

interface WineSearchSheetProps {
  wineName?: string
  millesime?: number | string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

interface SearchLink {
  name: string
  buildUrl: (name: string, year: string) => string
  borderColor: string
}

const searchLinks: SearchLink[] = [
  {
    name: "Vivino",
    buildUrl: (name, year) =>
      `https://www.vivino.com/search/wines?q=${encodeURIComponent(name + " " + year)}`,
    borderColor: "border-l-4 border-l-red-500",
  },
  {
    name: "Wine-Searcher",
    buildUrl: (name, year) =>
      `https://www.wine-searcher.com/find/${encodeURIComponent(name + " " + year)}`,
    borderColor: "border-l-4 border-l-blue-900",
  },
  {
    name: "Google Shopping",
    buildUrl: (name, year) =>
      `https://www.google.com/search?q=${encodeURIComponent(name + " " + year + " acheter")}&tbm=shop`,
    borderColor: "border-l-4 border-l-blue-500",
  },
  {
    name: "IdealWine",
    buildUrl: (name, year) =>
      `https://www.idealwine.com/fr/recherche/?search=${encodeURIComponent(name + " " + year)}`,
    borderColor: "border-l-4 border-l-primary",
  },
]

export function WineSearchSheet({
  wineName,
  millesime,
  isOpen,
  onOpenChange,
}: WineSearchSheetProps) {
  const displayName = sanitizeWineName(wineName) || "Vin inconnu"
  const displayYear = millesime ? String(millesime) : ""
  const fullTitle = `${displayName}${displayYear ? ` ${displayYear}` : ""}`

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90dvh] flex flex-col">
        <SheetHeader
          className="mb-6"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
        >
          <SheetTitle className="text-center font-serif text-xl">
            {fullTitle}
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto flex-1">
        {/* Search links */}
        <div className="flex flex-col gap-3 mb-6">
          {searchLinks.map((link) => (
            <a
              key={link.name}
              href={link.buildUrl(displayName, displayYear)}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between rounded-lg bg-card p-3 transition-colors hover:bg-card/80 ${link.borderColor}`}
            >
              <span className="text-sm font-medium text-foreground">
                {link.name}
              </span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-xs text-muted-foreground">
          Les prix peuvent varier selon les revendeurs
        </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
