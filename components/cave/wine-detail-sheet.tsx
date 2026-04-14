"use client"

import { useEffect, useState, useCallback } from "react"
import { X, Star } from "lucide-react"
import { sanitizeWineName } from "@/lib/wine-helpers"
import { WineBottleThumb } from "@/components/cave/wine-bottle-thumb"
import type { Wine, WineEnrichment } from "@/data/apogee"
import { getApogee } from "@/data/apogee"

interface WineDetailSheetProps {
  wine: Wine
  onClose: () => void
  onConsume: () => void
  onActionsOpen: () => void
  myRating?: number | null
  actionsLabel?: string
}

function ApogeeStatusBadge({ wine }: { wine: Wine }) {
  const apogee = getApogee(wine)
  if (!apogee) return null
  const map = {
    urgent: { label: "⏰ À boire", className: "bg-red-100 text-red-700" },
    late: { label: "🔴 Trop tard", className: "bg-red-200 text-red-800" },
    ok: { label: "🍃 En forme", className: "bg-green-100 text-green-700" },
    wait: { label: "⏳ Attendre", className: "bg-yellow-100 text-yellow-700" },
  }
  const info = map[apogee.st as keyof typeof map]
  if (!info) return null
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${info.className}`}>
      {info.label}
    </span>
  )
}

function SkeletonLine({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className ?? "h-4 w-full"}`} />
}

function TasteBar({ label, oppositeLabel, value }: { label: string; oppositeLabel: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-14 text-right flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cave-bordeaux to-cave-terracotta"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-500 w-16 flex-shrink-0">{oppositeLabel}</span>
    </div>
  )
}

export function WineDetailSheet({
  wine,
  onClose,
  onConsume,
  onActionsOpen,
  myRating,
  actionsLabel = "⋯ Actions",
}: WineDetailSheetProps) {
  const [enrichment, setEnrichment] = useState<WineEnrichment | null>(
    wine.enrichissement ?? null
  )
  const [isEnriching, setIsEnriching] = useState(false)

  const wineName = sanitizeWineName(wine.wine_name)
  const apogeeResult = getApogee(wine)

  const triggerEnrichment = useCallback(async () => {
    if (enrichment || isEnriching) return
    setIsEnriching(true)
    try {
      const res = await fetch("/api/enrich-wine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wineName: wine.wine_name,
          millesime: wine.millesime_year,
          region: wine.wine_region,
          appellation: wine.wine_appellation,
        }),
      })
      if (!res.ok) return
      const data: WineEnrichment = await res.json()
      setEnrichment(data)
    } catch {
      // silently fail
    } finally {
      setIsEnriching(false)
    }
  }, [enrichment, isEnriching, wine])

  useEffect(() => {
    triggerEnrichment()
  }, [triggerEnrichment])

  const heroGradient =
    wine.wine_type === "wine_white" || wine.wine_type === "wine_white_sparkling"
      ? "from-cave-blanc-noir via-cave-blanc-profond to-cave-blanc-dore"
      : wine.wine_type === "wine_rose"
      ? "from-cave-rose-noir via-cave-rose-profond to-cave-rose-vif"
      : "from-cave-bg via-cave-rouge-sombre to-cave-bordeaux"

  const WINE_TYPE_LABELS: Record<string, string> = {
    wine_red: "Rouge",
    wine_white: "Blanc",
    wine_white_sparkling: "Pétillant",
    wine_rose: "Rosé",
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex-1 overflow-y-auto">

        {/* Section 1 : Hero visuel */}
        <div className={`relative h-64 bg-gradient-to-b ${heroGradient} flex items-end`}>
          {enrichment?.bottle_image_url && (
            <img
              src={enrichment.bottle_image_url}
              alt={wineName ?? ""}
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <WineBottleThumb
              imageUrl={enrichment?.bottle_image_url}
              wineType={wine.wine_type}
              size="md"
            />
          </div>
          <div className="relative z-10 w-full px-5 pb-4 pt-16 bg-gradient-to-t from-black/60 to-transparent">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {wine.wine_type && (
                <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">
                  {WINE_TYPE_LABELS[wine.wine_type] ?? wine.wine_type}
                </span>
              )}
              {wine.millesime_year && (
                <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">
                  {String(wine.millesime_year)}
                </span>
              )}
              <ApogeeStatusBadge wine={wine} />
            </div>
            <div className="text-white font-bold text-lg leading-tight">
              {wineName}
            </div>
            {wine.wine_domain && (
              <div className="text-white/70 text-sm mt-0.5">{wine.wine_domain}</div>
            )}
            {wine.wine_region && (
              <div className="text-white/50 text-xs mt-0.5">{wine.wine_region}</div>
            )}
          </div>
        </div>

        {/* Section 2 : À propos du domaine */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            À propos du domaine
          </div>
          {isEnriching && !enrichment?.description ? (
            <div className="flex flex-col gap-2">
              <SkeletonLine className="h-3.5 w-full" />
              <SkeletonLine className="h-3.5 w-5/6" />
              <SkeletonLine className="h-3.5 w-4/6" />
            </div>
          ) : enrichment?.description ? (
            <p className="text-sm text-gray-600 leading-relaxed">{enrichment.description}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Aucune information disponible.</p>
          )}
        </div>

        {/* Section 3 : Notes & avis */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Notes &amp; avis
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-50 rounded-2xl p-3 text-center">
              {isEnriching && !enrichment?.notes ? (
                <SkeletonLine className="h-7 w-16 mx-auto mb-1" />
              ) : enrichment?.notes ? (
                <div className="text-2xl font-black text-cave-bordeaux">{enrichment.notes}</div>
              ) : (
                <div className="text-2xl font-black text-gray-200">—</div>
              )}
              <div className="flex justify-center gap-0.5 my-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-3 h-3"
                    fill={enrichment?.notes ? "#f59e0b" : "#e5e7eb"}
                    stroke="none"
                  />
                ))}
              </div>
              <div className="text-xs text-gray-400">Note des experts</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 text-center">
              {myRating != null ? (
                <div className="text-2xl font-black text-cave-bordeaux">{myRating}/5</div>
              ) : (
                <div className="text-2xl font-black text-gray-200">—</div>
              )}
              <div className="flex justify-center gap-0.5 my-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-3 h-3"
                    fill={myRating && i <= myRating ? "#f59e0b" : "#e5e7eb"}
                    stroke="none"
                  />
                ))}
              </div>
              <div className="text-xs text-gray-400">
                {myRating ? "Ma note" : "Pas encore noté"}
              </div>
            </div>
          </div>
          {enrichment?.noteSummary && (
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-3">
              <p className="text-sm text-gray-600 italic leading-relaxed">
                &ldquo;{enrichment.noteSummary}&rdquo;
              </p>
              {enrichment.source && (
                <div className="text-xs text-gray-400 mt-1.5">— {enrichment.source}</div>
              )}
            </div>
          )}
          {!enrichment?.notes && !isEnriching && (
            <p className="text-sm text-gray-400 italic">Pas encore de note critique disponible.</p>
          )}
        </div>

        {/* Section 4 : Profil gustatif */}
        {(enrichment?.taste_profile || isEnriching) && (
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Profil gustatif
            </div>
            {isEnriching && !enrichment?.taste_profile ? (
              <div className="flex flex-col gap-3">
                <SkeletonLine className="h-3 w-full" />
                <SkeletonLine className="h-3 w-full" />
                <SkeletonLine className="h-3 w-full" />
              </div>
            ) : enrichment?.taste_profile ? (
              <div className="flex flex-col gap-3">
                <TasteBar label="Léger" oppositeLabel="Puissant" value={enrichment.taste_profile.body} />
                {enrichment.taste_profile.tannin > 0 && (
                  <TasteBar label="Souple" oppositeLabel="Tannique" value={enrichment.taste_profile.tannin} />
                )}
                <TasteBar label="Doux" oppositeLabel="Acide" value={enrichment.taste_profile.acidity} />
                <TasteBar label="Simple" oppositeLabel="Complexe" value={enrichment.taste_profile.complexity} />
              </div>
            ) : null}
          </div>
        )}

        {/* Section 5 : Apogée + Prix */}
        {(apogeeResult || enrichment?.prixMoyen) && (
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Apogée &amp; Prix
            </div>
            <div className="flex gap-3">
              {apogeeResult && (
                <div className="flex-1 bg-gray-50 rounded-2xl p-3">
                  <div className="text-xs text-gray-400 mb-1">Fenêtre idéale</div>
                  <div className="text-base font-black text-gray-800">
                    {apogeeResult.label}
                  </div>
                  <ApogeeStatusBadge wine={wine} />
                </div>
              )}
              {enrichment?.prixMoyen && (
                <div className="flex-1 bg-gray-50 rounded-2xl p-3">
                  <div className="text-xs text-gray-400 mb-1">Prix estimé</div>
                  <div className="text-base font-black text-cave-bordeaux">{enrichment.prixMoyen}</div>
                  <div className="text-xs text-gray-400">/ bouteille</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="h-24" />
      </div>

      {/* Actions fixed bas */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex gap-3 px-4 pt-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <button
          onClick={onActionsOpen}
          className="flex-1 bg-gray-100 rounded-2xl py-3.5 text-sm font-semibold text-gray-600"
        >
          {actionsLabel}
        </button>
        <button
          onClick={onConsume}
          className="flex-[1.5] bg-cave-bordeaux rounded-2xl py-3.5 text-sm font-bold text-white"
        >
          − Consommer
        </button>
      </div>
    </div>
  )
}
