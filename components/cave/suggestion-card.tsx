"use client"

import { Thermometer, Wine as WineGlass, Sparkles } from "lucide-react"
import { CaveBadge } from "./cave-badge"
import { getIcon, getLabel, getColor, formatRegion, sanitizeWineName } from "@/lib/wine-helpers"
import { getUnifiedApogee, unifiedToLegacySt } from "@/lib/apogee-unified"
import type { Wine } from "@/data/apogee"

interface SuggestionCardProps {
  wine: Wine
  reason: string
  temperature?: string
  serving?: string
  aiGenerated?: boolean
}

const wineSurface: Record<string, { bg: string; fg: string }> = {
  wine_red:       { bg: "var(--rouge)",   fg: "var(--rouge-fg)" },
  wine_white:     { bg: "var(--blanc)",   fg: "var(--blanc-fg)" },
  wine_sparkling: { bg: "var(--bulle)",   fg: "var(--bulle-fg)" },
  wine_rose:      { bg: "var(--rose)",    fg: "var(--rose-fg)" },
}
const fallbackSurface = { bg: "var(--paper-2)", fg: "var(--ink)" }

const colorBadgeVariant: Record<string, "gold" | "muted"> = {
  red: "gold",
  white: "muted",
  sparkling: "muted",
  rose: "muted",
  unknown: "muted",
}

export function SuggestionCard({
  wine,
  reason,
  temperature,
  serving,
  aiGenerated,
}: SuggestionCardProps) {
  const unified = getUnifiedApogee(wine)
  const color = getColor(wine.wine_type || "")
  const icon = getIcon(wine.wine_type || "")
  const label = getLabel(wine.wine_type || "")
  const region = formatRegion(wine.wine_region || "")
  const apogeeBadgeVariant = unified ? unifiedToLegacySt(unified) : undefined
  const surf = (wine.wine_type ? wineSurface[wine.wine_type] : undefined) ?? fallbackSurface

  return (
    <div
      className="overflow-hidden rounded-xl border-2 border-ink"
      style={{ boxShadow: "3px 3px 0 var(--shadow-hard)" }}
    >
      {/* Colored header strip */}
      <div
        className="flex items-start gap-3 px-4 pt-4 pb-3"
        style={{ background: surf.bg, color: surf.fg }}
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
          style={{ background: "rgba(0,0,0,0.12)" }}
          aria-hidden="true"
        >
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="flex-1 font-serif italic text-lg leading-tight" style={{ color: surf.fg }}>
              {sanitizeWineName(wine.wine_name || wine.wine_appellation || "Vin inconnu")}
              {wine.millesime_year ? (
                <span className="ml-1.5 text-sm not-italic opacity-70">
                  {wine.millesime_year}
                </span>
              ) : null}
            </p>
            {aiGenerated && (
              <span
                className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: "rgba(0,0,0,0.15)", color: surf.fg }}
              >
                <Sparkles className="h-2.5 w-2.5" />
                IA
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs opacity-70">
            {wine.wine_domain ? `${wine.wine_domain}` : ""}
            {wine.wine_domain && region ? " · " : ""}
            {region}
          </p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-ink bg-paper-2 px-4 py-2">
        <CaveBadge label={`${icon} ${label}`} variant={colorBadgeVariant[color]} />
        {unified && apogeeBadgeVariant && (
          <CaveBadge label={unified!.label} variant={apogeeBadgeVariant} />
        )}
      </div>

      {/* Reason */}
      <div className="border-t border-ink bg-paper-2 px-4 py-3">
        <p className="text-sm leading-relaxed text-ink">{reason}</p>
      </div>

      {/* Temperature & Serving advice */}
      {(temperature || serving) && (
        <div className="flex flex-col gap-2 border-t border-ink bg-paper-2 px-4 py-3">
          {temperature && (
            <div className="flex items-center gap-2">
              <Thermometer className="h-3.5 w-3.5 shrink-0 text-rouge" />
              <span className="text-xs text-ink-soft">{temperature}</span>
            </div>
          )}
          {serving && (
            <div className="flex items-center gap-2">
              <WineGlass className="h-3.5 w-3.5 shrink-0 text-rouge" />
              <span className="text-xs text-ink-soft">{serving}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
