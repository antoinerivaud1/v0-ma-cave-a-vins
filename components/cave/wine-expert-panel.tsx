'use client'

import { useState } from 'react'
import { Thermometer, Clock, Droplets, Calendar, ExternalLink } from 'lucide-react'
import { WineSearchSheet } from './wine-search-sheet'
import { getWineExpert } from '@/lib/wine-expert'
import type { WineExpert } from '@/lib/wine-expert'

interface WineExpertPanelProps {
  region?: string
  cepage?: string
  millesime?: number
  wineName?: string
}

const potentielStyles: Record<WineExpert['potentiel'], string> = {
  wait: 'bg-sky-950/40 text-sky-400 border-sky-800/40',
  apogee: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40',
  drink: 'bg-amber-950/40 text-amber-400 border-amber-800/40',
  urgent: 'bg-destructive/15 text-destructive border-destructive/30',
}

export function WineExpertPanel({ region, cepage, millesime, wineName }: WineExpertPanelProps) {
  const [searchSheetOpen, setSearchSheetOpen] = useState(false)
  const expert = getWineExpert(region, cepage, millesime)

  return (
    <div className="rounded-lg border border-cave-border bg-secondary/50">
      {/* Tasting Notes */}
      <div className="px-3.5 pt-3 pb-2.5">
        <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Notes de degustation
        </h4>
        <div className="flex flex-col gap-2">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wide text-primary/70">Aromes</span>
            <p className="mt-0.5 text-sm leading-relaxed text-foreground">{expert.aromes}</p>
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wide text-primary/70">Bouche</span>
            <p className="mt-0.5 text-sm leading-relaxed text-foreground">{expert.bouche}</p>
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wide text-primary/70">Finale</span>
            <p className="mt-0.5 text-sm leading-relaxed text-foreground">{expert.finale}</p>
          </div>
        </div>
      </div>

      {/* Service + Garde Grid */}
      <div className="grid grid-cols-2 gap-px border-t border-cave-border bg-cave-border">
        {/* Service */}
        <div className="flex flex-col gap-2 bg-secondary/50 px-3.5 py-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Service
          </h4>
          <div className="flex items-center gap-2">
            <Thermometer className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span className="text-xs text-foreground">{expert.temperature}</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span className="text-xs text-foreground">{expert.carafage}</span>
          </div>
        </div>

        {/* Garde */}
        <div className="flex flex-col gap-2 bg-secondary/50 px-3.5 py-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Garde
          </h4>
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span className="text-xs text-foreground">{expert.apogeeRange}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span
              className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${potentielStyles[expert.potentiel]}`}
            >
              {expert.potentielLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Find online button */}
      <button
        onClick={() => setSearchSheetOpen(true)}
        className="w-full border-t border-cave-border bg-secondary/50 px-3.5 py-3 flex items-center justify-between rounded-b-lg text-sm font-medium text-primary hover:bg-secondary transition-colors"
      >
        <span>Trouver ce vin en ligne</span>
        <ExternalLink className="h-4 w-4" />
      </button>

      {/* Wine search sheet */}
      <WineSearchSheet
        wineName={wineName}
        millesime={millesime}
        isOpen={searchSheetOpen}
        onOpenChange={setSearchSheetOpen}
      />
    </div>
  )
}
