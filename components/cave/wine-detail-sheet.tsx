"use client"

import { X, Star, Sparkles, Lock } from "lucide-react"
import { sanitizeWineName, getLabel, formatRegion, getDrinkingStatus } from "@/lib/wine-helpers"
import { WineBottleThumb } from "@/components/cave/wine-bottle-thumb"
import type { Wine } from "@/data/apogee"
import { getApogee } from "@/data/apogee"
import { useWineEnrichment } from "@/hooks/use-wine-enrichment"
import { useAuth } from "@/hooks/use-auth"

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

function DrinkingStatusBadge({
  start,
  end,
}: {
  start: string | number | null | undefined
  end: string | number | null | undefined
}) {
  const status = getDrinkingStatus(start, end)
  if (status === "unknown") return null
  const map = {
    trop_tot: { label: "⏳ Trop tôt", className: "bg-amber-100 text-amber-700" },
    a_point: { label: "🍃 À point", className: "bg-green-100 text-green-700" },
    trop_tard: { label: "🔴 Trop tard", className: "bg-red-200 text-red-800" },
  }
  const info = map[status]
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

function TasteBar({
  label,
  oppositeLabel,
  value,
}: {
  label: string
  oppositeLabel: string
  value: number
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-14 text-right flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cave-bordeaux to-cave-terracotta"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-500 w-16 flex-shrink-0">
        {oppositeLabel}
      </span>
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
  const wineId = wine.id ?? null
  const { enrichment, isLoading, error, enrich } = useWineEnrichment(wineId)
  const { rawPlan, role } = useAuth()

  const wineName = sanitizeWineName(wine.wine_name)
  const apogeeResult = getApogee(wine)

  const isCollector =
    rawPlan === "collector" ||
    role === "admin" ||
    role === "beta"

  const canEnrich = !!wineId && enrichment === null && !isLoading

  const heroGradient =
    wine.wine_type === "wine_white" || wine.wine_type === "wine_white_sparkling"
      ? "from-cave-blanc-noir via-cave-blanc-profond to-cave-blanc-dore"
      : wine.wine_type === "wine_rose"
      ? "from-cave-rose-noir via-cave-rose-profond to-cave-rose-vif"
      : "from-cave-bg via-cave-rouge-sombre to-cave-bordeaux"

  // Apogée : préférence aux données enrichies, sinon fallback statique
  const apogeeStart = enrichment?.apogee_start ?? null
  const apogeeEnd = enrichment?.apogee_end ?? null
  const hasEnrichedApogee = apogeeStart !== null && apogeeEnd !== null

  // Prix : données enrichies
  const priceMin = enrichment?.price_min ?? null
  const priceMax = enrichment?.price_max ?? null
  const hasPrice = priceMin !== null

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
            className="absolute left-4 z-20 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            style={{ top: "calc(1rem + env(safe-area-inset-top, 0px))" }}
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
              {wine.wine_type && getLabel(wine.wine_type) !== "Inconnu" && (
                <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">
                  {getLabel(wine.wine_type)}
                </span>
              )}
              {wine.millesime_year && (
                <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">
                  {String(wine.millesime_year)}
                </span>
              )}
              <ApogeeStatusBadge wine={wine} />
            </div>
            <div className="text-white font-bold text-lg leading-tight">{wineName}</div>
            {wine.wine_domain && (
              <div className="text-white/70 text-sm mt-0.5">{wine.wine_domain}</div>
            )}
            {wine.wine_region && (
              <div className="text-white/50 text-xs mt-0.5">{formatRegion(wine.wine_region)}</div>
            )}
          </div>
        </div>

        {/* Bouton "Analyser ce vin" — visible si pas d'enrichissement et wineId présent */}
        {canEnrich && isCollector && (
          <div className="mx-5 mt-4 mb-1">
            <button
              onClick={enrich}
              className="w-full flex items-center justify-center gap-2 bg-cave-bordeaux rounded-2xl py-3.5 text-sm font-bold text-white"
            >
              <Sparkles className="w-4 h-4" />
              Analyser ce vin avec l&rsquo;IA
            </button>
          </div>
        )}
        {canEnrich && !isCollector && (
          <div className="mx-5 mt-4 mb-1">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <Lock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Analyse IA</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Disponible avec l&apos;abonnement Collectionneur — description, profil
                  gustatif, accords mets et bien plus.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Skeleton global pendant le chargement initial */}
        {isLoading && (
          <div className="px-5 py-4 flex flex-col gap-3">
            <SkeletonLine className="h-4 w-2/3" />
            <SkeletonLine className="h-3.5 w-full" />
            <SkeletonLine className="h-3.5 w-5/6" />
            <SkeletonLine className="h-3.5 w-4/6" />
          </div>
        )}

        {/* Erreur enrichissement */}
        {error && !isLoading && (
          <div className="mx-5 mt-4 mb-1 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Section 2 : Description du vin */}
        {(isLoading || enrichment?.description) && (
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              À propos du vin
            </div>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                <SkeletonLine className="h-3.5 w-full" />
                <SkeletonLine className="h-3.5 w-5/6" />
                <SkeletonLine className="h-3.5 w-4/6" />
              </div>
            ) : (
              <p className="text-sm text-gray-600 leading-relaxed">{enrichment!.description}</p>
            )}
          </div>
        )}

        {/* Section 3 : Informations domaine */}
        {(isLoading || enrichment?.domaine_history || enrichment?.domaine_style) && (
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Le domaine
            </div>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                <SkeletonLine className="h-3.5 w-full" />
                <SkeletonLine className="h-3.5 w-5/6" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {enrichment!.domaine_history && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {enrichment!.domaine_history}
                  </p>
                )}
                {enrichment!.domaine_style && (
                  <p className="text-sm text-gray-500 italic leading-relaxed">
                    {enrichment!.domaine_style}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Section 4 : Note critique */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Notes &amp; avis
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-2xl p-3 text-center">
              {isLoading ? (
                <SkeletonLine className="h-7 w-16 mx-auto mb-1" />
              ) : enrichment?.critic_score ? (
                <div className="text-2xl font-black text-cave-bordeaux">
                  {enrichment.critic_score}
                  <span className="text-sm font-normal text-gray-400">/100</span>
                </div>
              ) : (
                <div className="text-2xl font-black text-gray-200">—</div>
              )}
              <div className="flex justify-center gap-0.5 my-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-3 h-3"
                    fill={enrichment?.critic_score ? "#f59e0b" : "#e5e7eb"}
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
        </div>

        {/* Section 5 : Profil gustatif */}
        {(isLoading || enrichment?.taste_profile) && (
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Profil gustatif
            </div>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                <SkeletonLine className="h-3 w-full" />
                <SkeletonLine className="h-3 w-full" />
                <SkeletonLine className="h-3 w-full" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <TasteBar
                  label="Léger"
                  oppositeLabel="Puissant"
                  value={enrichment!.taste_profile!.body}
                />
                {enrichment!.taste_profile!.tannins > 0 && (
                  <TasteBar
                    label="Souple"
                    oppositeLabel="Tannique"
                    value={enrichment!.taste_profile!.tannins}
                  />
                )}
                <TasteBar
                  label="Doux"
                  oppositeLabel="Acide"
                  value={enrichment!.taste_profile!.acidity}
                />
                <TasteBar
                  label="Simple"
                  oppositeLabel="Complexe"
                  value={enrichment!.taste_profile!.complexity}
                />
              </div>
            )}
          </div>
        )}

        {/* Section 6 : Accords mets */}
        {(isLoading || (enrichment?.food_pairings && enrichment.food_pairings.length > 0)) && (
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Accords mets
            </div>
            {isLoading ? (
              <div className="flex gap-2 flex-wrap">
                <SkeletonLine className="h-7 w-28 rounded-full" />
                <SkeletonLine className="h-7 w-24 rounded-full" />
                <SkeletonLine className="h-7 w-32 rounded-full" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {enrichment!.food_pairings!.map((pairing, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium bg-cave-bordeaux/10 text-cave-bordeaux px-3 py-1.5 rounded-full"
                  >
                    {pairing}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 7 : Apogée & Prix */}
        {(apogeeResult || hasEnrichedApogee || hasPrice || isLoading) && (
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Apogée &amp; Prix
            </div>
            <div className="flex gap-3">
              {/* Apogée : enrichi en priorité, sinon statique */}
              {isLoading ? (
                <div className="flex-1 bg-gray-50 rounded-2xl p-3">
                  <SkeletonLine className="h-3 w-24 mb-2" />
                  <SkeletonLine className="h-5 w-20" />
                </div>
              ) : hasEnrichedApogee ? (
                <div className="flex-1 bg-gray-50 rounded-2xl p-3">
                  <div className="text-xs text-gray-400 mb-1">Fenêtre idéale</div>
                  <div className="text-base font-black text-gray-800">
                    {apogeeStart} – {apogeeEnd}
                  </div>
                  <DrinkingStatusBadge start={apogeeStart} end={apogeeEnd} />
                </div>
              ) : apogeeResult ? (
                <div className="flex-1 bg-gray-50 rounded-2xl p-3">
                  <div className="text-xs text-gray-400 mb-1">Fenêtre idéale</div>
                  <div className="text-base font-black text-gray-800">{apogeeResult.label}</div>
                  <ApogeeStatusBadge wine={wine} />
                </div>
              ) : null}

              {/* Prix estimé */}
              {isLoading ? (
                <div className="flex-1 bg-gray-50 rounded-2xl p-3">
                  <SkeletonLine className="h-3 w-20 mb-2" />
                  <SkeletonLine className="h-5 w-16" />
                </div>
              ) : hasPrice ? (
                <div className="flex-1 bg-gray-50 rounded-2xl p-3">
                  <div className="text-xs text-gray-400 mb-1">Prix estimé</div>
                  <div className="text-base font-black text-cave-bordeaux">
                    {priceMin === priceMax ? `${priceMin}€` : `${priceMin}–${priceMax}€`}
                  </div>
                  <div className="text-xs text-gray-400">/ bouteille</div>
                </div>
              ) : null}
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
