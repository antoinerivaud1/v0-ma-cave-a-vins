"use client"

import type { Tasting } from "@/hooks/use-tastings"

interface TastingStatsProps {
  tastings: Tasting[]
}

function computeStats(tastings: Tasting[]) {
  if (tastings.length === 0) {
    return { count: 0, avgStars: null, topRegion: null }
  }

  const count = tastings.length
  const avgStars = tastings.reduce((sum, t) => sum + t.stars, 0) / count

  const regionCount: Record<string, number> = {}
  for (const t of tastings) {
    const region = t.region ?? "Inconnue"
    regionCount[region] = (regionCount[region] ?? 0) + 1
  }
  const topRegion = Object.entries(regionCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return { count, avgStars, topRegion }
}

export function TastingStats({ tastings }: TastingStatsProps) {
  const { count, avgStars, topRegion } = computeStats(tastings)

  return (
    <div
      className="bg-cave-bordeaux px-4 pb-4 pt-4"
      style={{ paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))" }}
    >
      <h1 className="mb-3 font-serif text-lg font-medium text-white">
        Carnet de dégustation
      </h1>
      <div className="flex gap-0">
        <div className="flex flex-1 flex-col items-center border-r border-white/20 py-1">
          <span className="text-2xl font-bold text-white">{count}</span>
          <span className="text-[10px] text-white/70">vins notés</span>
        </div>
        <div className="flex flex-1 flex-col items-center border-r border-white/20 py-1">
          <span className="text-2xl font-bold text-white">
            {avgStars !== null ? `★ ${avgStars.toFixed(1)}` : "—"}
          </span>
          <span className="text-[10px] text-white/70">note moy.</span>
        </div>
        <div className="flex flex-1 flex-col items-center py-1">
          <span className="truncate text-sm font-bold text-white px-1 text-center leading-tight">
            {topRegion ? topRegion.split(" ").slice(0, 2).join(" ") : "—"}
          </span>
          <span className="text-[10px] text-white/70">région préf.</span>
        </div>
      </div>
    </div>
  )
}
