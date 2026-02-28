'use client'

import { MapPin } from 'lucide-react'
import { PageHeader } from './page-header'
import { REGIONS } from '@/data/regions'
import type { Wine } from '@/data/apogee'

interface MapViewProps {
  cave: Wine[]
}

export function MapView({ cave }: MapViewProps) {
  // Count wines by region
  const regionCounts = cave.reduce<Record<string, number>>((acc, w) => {
    const region = w.wine_region || 'unknown'
    acc[region] = (acc[region] || 0) + (Number(w.bottle_quantity) || 0)
    return acc
  }, {})

  return (
    <div className="pb-4">
      <PageHeader title="Carte des Regions" subtitle="Vos vins par region viticole" />

      <div className="mt-4 flex flex-col gap-2 px-4">
        {Object.entries(REGIONS).map(([key, region]) => {
          const count = regionCounts[key] || 0
          return (
            <div
              key={key}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                count > 0
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-cave-border bg-card'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin
                  className={`h-4 w-4 ${count > 0 ? 'text-primary' : 'text-muted-foreground'}`}
                />
                <div>
                  <p className={`text-sm font-medium ${count > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {region.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {region.appellations.length} appellations
                  </p>
                </div>
              </div>
              {count > 0 && (
                <span className="font-serif text-lg font-semibold text-primary">{count}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
