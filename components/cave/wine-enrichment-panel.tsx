"use client"

import { Loader2, Sparkles, Euro, Star, ExternalLink } from "lucide-react"
import type { WineEnrichment } from "@/hooks/use-wine-enrichment"

interface WineEnrichmentPanelProps {
  enrichment: WineEnrichment | null
  isLoading: boolean
}

export function WineEnrichmentPanel({ enrichment, isLoading }: WineEnrichmentPanelProps) {
  if (isLoading) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-cave-border bg-muted/30 px-3 py-2.5">
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Enrichissement en cours…</p>
      </div>
    )
  }

  if (!enrichment) return null

  return (
    <div className="mt-3 flex flex-col gap-2.5 rounded-lg border border-cave-border bg-muted/20 px-3 py-3">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
          Fiche enrichie
        </span>
      </div>

      {/* Description */}
      {enrichment.description && (
        <p className="text-xs leading-relaxed text-foreground">{enrichment.description}</p>
      )}

      {/* Cépages */}
      {enrichment.cepages.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {enrichment.cepages.map((c) => (
            <span
              key={c}
              className="rounded-md border border-cave-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Apogée */}
      {enrichment.apogee && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Apogée :</span>{" "}
          {enrichment.apogee.debut}–{enrichment.apogee.fin}
        </p>
      )}

      {/* Prix */}
      {enrichment.prixMoyen && (
        <div className="flex items-center gap-1">
          <Euro className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{enrichment.prixMoyen}</span>
        </div>
      )}

      {/* Note web — badge ambré mis en valeur */}
      {enrichment.notes && (
        <div className="flex flex-col gap-1 rounded-md bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 px-2.5 py-2">
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              {enrichment.notes}
            </span>
          </div>
          {enrichment.noteSummary && (
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
              {enrichment.noteSummary}
            </p>
          )}
        </div>
      )}

      {/* Source */}
      {enrichment.source && (
        <div className="flex items-center gap-1">
          <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate text-[10px] text-muted-foreground">{enrichment.source}</span>
        </div>
      )}
    </div>
  )
}
