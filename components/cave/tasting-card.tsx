"use client"

import { Star } from "lucide-react"
import { sanitizeWineName } from "@/lib/wine-helpers"
import type { Tasting } from "@/hooks/use-tastings"

interface TastingCardProps {
  tasting: Tasting
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function TastingCard({ tasting }: TastingCardProps) {
  return (
    <div className="rounded-xl border border-cave-border bg-card px-3.5 py-3">
      {/* En-tête : nom + étoiles */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <p className="truncate font-cormorant text-base font-normal text-foreground">
            {sanitizeWineName(tasting.wine_name) || "Vin inconnu"}
            {tasting.millesime && (
              <span className="ml-1.5 font-sans text-base font-semibold tabular-nums text-muted-foreground">
                {tasting.millesime}
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {[tasting.appellation, tasting.region].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 gap-0.5 mt-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i <= tasting.stars
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Commentaire perso */}
      {tasting.comment && (
        <p className="text-xs text-muted-foreground italic mb-2">{tasting.comment}</p>
      )}

      {/* Badge note web */}
      {tasting.web_score && (
        <div className="flex items-start gap-1.5 rounded-md bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 px-2 py-1.5 mb-2">
          <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400 mt-0.5" />
          <div>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              {tasting.web_score}
              {tasting.web_source && ` · ${tasting.web_source}`}
            </span>
            {tasting.web_summary && (
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed mt-0.5">
                {tasting.web_summary}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Date */}
      <p className="text-[10px] text-muted-foreground/60">{formatDate(tasting.tasted_at)}</p>
    </div>
  )
}
