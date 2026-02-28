'use client'

import { Wine as WineIcon, Search } from 'lucide-react'
import { PageHeader } from './page-header'
import type { Wine } from '@/data/apogee'

interface CaveListProps {
  cave: Wine[]
}

export function CaveList({ cave }: CaveListProps) {
  const totalBottles = cave.reduce((s, w) => s + (Number(w.bottle_quantity) || 0), 0)

  return (
    <div className="pb-4">
      <PageHeader title="Ma Liste" subtitle={`${cave.length} references, ${totalBottles} bouteilles`} />

      {/* Search placeholder */}
      <div className="mx-4 mt-3">
        <div className="flex items-center gap-2 rounded-lg border border-cave-border bg-card px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Rechercher un vin...</span>
        </div>
      </div>

      {/* Wine list */}
      <div className="mt-4 flex flex-col gap-2 px-4">
        {cave.slice(0, 20).map((wine, i) => (
          <div
            key={`${wine.wine_name}-${i}`}
            className="flex items-center gap-3 rounded-lg border border-cave-border bg-card px-3 py-3"
          >
            <WineIcon className="h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {wine.wine_name || wine.wine_appellation || 'Vin inconnu'}
              </p>
              <p className="text-xs text-muted-foreground">
                {wine.millesime_year ? `${wine.millesime_year} - ` : ''}
                {wine.wine_region || wine.wine_appellation || ''}
                {wine.bottle_quantity ? ` (x${wine.bottle_quantity})` : ''}
              </p>
            </div>
          </div>
        ))}
        {cave.length > 20 && (
          <p className="py-2 text-center text-xs text-muted-foreground">
            Et {cave.length - 20} autres references...
          </p>
        )}
      </div>
    </div>
  )
}
