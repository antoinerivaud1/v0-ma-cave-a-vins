'use client'

import { Thermometer, Wine as WineGlass, Sparkles } from 'lucide-react'
import { CaveBadge } from './cave-badge'
import { getIcon, getLabel, getColor, formatRegion } from '@/lib/wine-helpers'
import { getApogee } from '@/data/apogee'
import type { Wine } from '@/data/apogee'

interface SuggestionCardProps {
  wine: Wine
  reason: string
  temperature?: string
  serving?: string
  aiGenerated?: boolean
}

const colorBadgeVariant: Record<string, 'gold' | 'muted'> = {
  red: 'gold',
  white: 'muted',
  sparkling: 'muted',
  rose: 'muted',
  unknown: 'muted',
}

export function SuggestionCard({
  wine,
  reason,
  temperature,
  serving,
  aiGenerated,
}: SuggestionCardProps) {
  const apogee = getApogee(wine)
  const color = getColor(wine.wine_type || '')
  const icon = getIcon(wine.wine_type || '')
  const label = getLabel(wine.wine_type || '')
  const region = formatRegion(wine.wine_region || '')

  const apogeeBadgeVariant = apogee
    ? (apogee.st as 'urgent' | 'ok' | 'wait' | 'late')
    : undefined

  return (
    <div className="overflow-hidden rounded-xl border border-cave-border bg-card">
      {/* Wine info header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg"
          aria-hidden="true"
        >
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="flex-1 font-serif text-lg font-semibold leading-tight text-foreground">
              {wine.wine_name || wine.wine_appellation || 'Vin inconnu'}
              {wine.millesime_year ? (
                <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                  {wine.millesime_year}
                </span>
              ) : null}
            </p>
            {aiGenerated && (
              <span className="flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                <Sparkles className="h-2.5 w-2.5" />
                IA
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {wine.wine_domain ? `${wine.wine_domain}` : ''}
            {wine.wine_domain && region ? ' \u00B7 ' : ''}
            {region}
          </p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
        <CaveBadge label={`${icon} ${label}`} variant={colorBadgeVariant[color]} />
        {apogee && apogeeBadgeVariant && (
          <CaveBadge label={apogee.label} variant={apogeeBadgeVariant} />
        )}
      </div>

      {/* Reason */}
      <div className="border-t border-cave-border px-4 py-3">
        <p className="text-sm leading-relaxed text-foreground">{reason}</p>
      </div>

      {/* Temperature & Serving advice */}
      {(temperature || serving) && (
        <div className="flex flex-col gap-2 border-t border-cave-border px-4 py-3">
          {temperature && (
            <div className="flex items-center gap-2">
              <Thermometer className="h-3.5 w-3.5 shrink-0 text-primary/70" />
              <span className="text-xs text-muted-foreground">{temperature}</span>
            </div>
          )}
          {serving && (
            <div className="flex items-center gap-2">
              <WineGlass className="h-3.5 w-3.5 shrink-0 text-primary/70" />
              <span className="text-xs text-muted-foreground">{serving}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
