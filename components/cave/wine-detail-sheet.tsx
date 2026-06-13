"use client"

import { useState } from "react"
import { X, Star, Sparkles, Lock, RefreshCw } from "lucide-react"
import { sanitizeWineName, getLabel, getColor } from "@/lib/wine-helpers"
import { WineBottleThumb } from "@/components/cave/wine-bottle-thumb"
import type { Wine } from "@/data/apogee"
import { useWineEnrichment } from "@/hooks/use-wine-enrichment"
import { useAuth } from "@/hooks/use-auth"
import { getUnifiedApogee } from "@/lib/apogee-unified"
import type { UnifiedApogeeStatus } from "@/lib/apogee-unified"
import { CycleChart } from "@/components/cave/synthese/cycle-chart"
import { ApogeeBar } from "@/components/cave/synthese/apogee-bar"

interface WineDetailSheetProps {
  wine: Wine
  onClose: () => void
  onConsume: () => void
  onActionsOpen: () => void
  myRating?: number | null
  actionsLabel?: string
}

// ── Surface couleur par type de vin (mapping MA-96) ──────────────────────────

const WINE_SURFACE: Record<string, { bg: string; fg: string; label: string }> = {
  red:      { bg: "var(--rouge)", fg: "var(--rouge-fg)", label: "Rouge" },
  white:    { bg: "var(--blanc)", fg: "var(--blanc-fg)", label: "Blanc" },
  sparkling: { bg: "var(--bulle)", fg: "var(--bulle-fg)", label: "Bulle" },
  rose:     { bg: "var(--rose)",  fg: "var(--rose-fg)",  label: "Rosé"  },
  unknown:  { bg: "var(--paper-2)", fg: "var(--ink)",    label: "Vin"   },
}

// ── Badge statut apogée unifié ───────────────────────────────────────────────

const STATUS_BADGE: Record<UnifiedApogeeStatus, { label: string; cls: string }> = {
  garde:   { label: "À garder",  cls: "bg-blue-100 text-blue-800" },
  optimal: { label: "Optimal",   cls: "bg-green-100 text-green-700" },
  apogee:  { label: "Apogée",    cls: "bg-amber-100 text-amber-800" },
  urgent:  { label: "À boire !", cls: "bg-red-100 text-red-700" },
}

function ApogeeStatusBadge({ status }: { status: UnifiedApogeeStatus }) {
  const info = STATUS_BADGE[status]
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${info.cls}`}>
      {info.label}
    </span>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonLine({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className ?? "h-4 w-full"}`} />
}

// ── TasteBar avec tokens CSS ──────────────────────────────────────────────────

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
      <span className="text-xs w-14 text-right flex-shrink-0" style={{ color: "var(--ink-soft)" }}>
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--paper-2)" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: "linear-gradient(to right, var(--rouge), var(--rouge))",
          }}
        />
      </div>
      <span className="text-xs font-semibold w-16 flex-shrink-0" style={{ color: "var(--ink-soft)" }}>
        {oppositeLabel}
      </span>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

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
  const colorKey = getColor(wine.wine_type || "")
  const surf = WINE_SURFACE[colorKey] ?? WINE_SURFACE.unknown

  const isCollector =
    rawPlan === "collector" ||
    role === "admin" ||
    role === "beta"

  const canEnrich = !!wineId && enrichment === null && !isLoading
  const canReEnrich = !!wineId && enrichment !== null && !isLoading
  const canUseEnrich =
    rawPlan === "amateur" ||
    rawPlan === "collector" ||
    role === "admin" ||
    role === "beta"
  const [confirmReEnrich, setConfirmReEnrich] = useState(false)

  // Apogée unifiée — passe enrichment si disponible, fallback heuristique sinon
  const unified = getUnifiedApogee(wine, enrichment)

  const millesime = parseInt(String(wine.millesime_year))

  // Prix
  const priceMin = enrichment?.price_min ?? null
  const priceMax = enrichment?.price_max ?? null
  const hasPrice = priceMin !== null

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{
        background: "var(--bg)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex-1 overflow-y-auto">

        {/* ── Section 1 : Hero visuel avec surface couleur type ───────────── */}
        <div
          className="relative h-64 flex items-end"
          style={{ background: surf.bg }}
        >
          {enrichment?.bottle_image_url && (
            <img
              src={enrichment.bottle_image_url}
              alt={wineName ?? ""}
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}

          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className="absolute left-4 z-20 w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              top: "calc(1rem + env(safe-area-inset-top, 0px))",
              background: "rgba(0,0,0,0.25)",
              backdropFilter: "blur(4px)",
            }}
            aria-label="Fermer"
          >
            <X className="w-5 h-5" style={{ color: surf.fg }} />
          </button>

          {/* Filigrane type */}
          <span
            aria-hidden
            className="absolute top-2 right-3 italic font-semibold pointer-events-none select-none"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 14cqi, 56px)",
              color: surf.fg,
              opacity: 0.18,
              lineHeight: 1,
            }}
          >
            {surf.label}
          </span>

          {/* Bouteille centrée */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <WineBottleThumb
              imageUrl={enrichment?.bottle_image_url}
              wineType={wine.wine_type}
              size="md"
            />
          </div>

          {/* Infos vin bas du hero */}
          <div
            className="relative z-10 w-full px-5 pb-4 pt-16"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
            }}
          >
            <div className="flex flex-wrap gap-1.5 mb-2">
              {wine.wine_type && getLabel(wine.wine_type) !== "Inconnu" && (
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(255,255,255,0.2)", color: surf.fg }}
                >
                  {getLabel(wine.wine_type)}
                </span>
              )}
              {wine.millesime_year && (
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(255,255,255,0.2)", color: surf.fg }}
                >
                  {String(wine.millesime_year)}
                </span>
              )}
              {unified && (
                <ApogeeStatusBadge status={unified.status} />
              )}
            </div>
            <div
              className="font-bold text-lg leading-tight"
              style={{ color: surf.fg }}
            >
              {wineName}
            </div>
            {wine.wine_domain && (
              <div className="text-sm mt-0.5" style={{ color: surf.fg, opacity: 0.75 }}>
                {wine.wine_domain}
              </div>
            )}
            {wine.wine_region && (
              <div className="text-xs mt-0.5" style={{ color: surf.fg, opacity: 0.55 }}>
                {wine.wine_region}
              </div>
            )}
          </div>
        </div>

        {/* ── CTA Enrichissement ──────────────────────────────────────────── */}
        {canEnrich && isCollector && (
          <div className="mx-5 mt-4 mb-1">
            <button
              onClick={enrich}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold"
              style={{ background: "var(--rouge)", color: "var(--rouge-fg)" }}
            >
              <Sparkles className="w-4 h-4" />
              Analyser ce vin avec l&rsquo;IA
            </button>
          </div>
        )}
        {canEnrich && !isCollector && (
          <div className="mx-5 mt-4 mb-1">
            <div
              className="flex items-start gap-3 rounded-2xl p-4"
              style={{
                background: "var(--paper-2)",
                border: "var(--border-hard)",
              }}
            >
              <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--ink-soft)" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                  Analyse IA
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>
                  Disponible avec l&apos;abonnement Collectionneur — description, profil
                  gustatif, accords mets et bien plus.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Skeleton global ──────────────────────────────────────────────── */}
        {isLoading && (
          <div className="px-5 py-4 flex flex-col gap-3">
            <SkeletonLine className="h-4 w-2/3" />
            <SkeletonLine className="h-3.5 w-full" />
            <SkeletonLine className="h-3.5 w-5/6" />
            <SkeletonLine className="h-3.5 w-4/6" />
          </div>
        )}

        {/* ── Erreur enrichissement ────────────────────────────────────────── */}
        {error && !isLoading && (
          <div
            className="mx-5 mt-4 mb-1 rounded-2xl px-4 py-3"
            style={{ background: "rgba(193,69,42,0.08)", border: "1px solid rgba(193,69,42,0.2)" }}
          >
            <p className="text-sm" style={{ color: "var(--urgent)" }}>
              {error}
            </p>
          </div>
        )}

        {/* ── Section 2 : Apogée — toujours visible (AC2) ─────────────────── */}
        {!isLoading && unified && !isNaN(millesime) && (
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            {/* Kicker uppercase */}
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--ink-soft)" }}
            >
              Apogée
            </div>

            {/* ApogeeBar */}
            <ApogeeBar unified={unified} fg="var(--ink)" />

            {/* CycleChart */}
            <div className="mt-4">
              <CycleChart
                unified={unified}
                millesime={millesime}
                accent={surf.bg}
                fg="var(--ink)"
              />
            </div>
          </div>
        )}

        {/* ── Section 3 : Description du vin ──────────────────────────────── */}
        {(isLoading || enrichment?.description) && (
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--ink-soft)" }}
            >
              À propos du vin
            </div>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                <SkeletonLine className="h-3.5 w-full" />
                <SkeletonLine className="h-3.5 w-5/6" />
                <SkeletonLine className="h-3.5 w-4/6" />
              </div>
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                {enrichment!.description}
              </p>
            )}
          </div>
        )}

        {/* ── Section 4 : Domaine ──────────────────────────────────────────── */}
        {(isLoading || enrichment?.domaine_history || enrichment?.domaine_style) && (
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--ink-soft)" }}
            >
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
                  <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                    {enrichment!.domaine_history}
                  </p>
                )}
                {enrichment!.domaine_style && (
                  <p
                    className="text-sm leading-relaxed italic"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    {enrichment!.domaine_style}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Section 5 : Notes & avis ─────────────────────────────────────── */}
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: "var(--ink-soft)" }}
          >
            Notes &amp; avis
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-2xl p-3 text-center"
              style={{ background: "var(--paper-2)" }}
            >
              {isLoading ? (
                <SkeletonLine className="h-7 w-16 mx-auto mb-1" />
              ) : enrichment?.critic_score ? (
                <div
                  className="text-2xl font-black"
                  style={{ color: "var(--rouge)" }}
                >
                  {enrichment.critic_score}
                  <span className="text-sm font-normal" style={{ color: "var(--ink-soft)" }}>
                    /100
                  </span>
                </div>
              ) : (
                <div className="text-2xl font-black" style={{ color: "var(--border)" }}>
                  —
                </div>
              )}
              <div className="flex justify-center gap-0.5 my-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-3 h-3"
                    fill={enrichment?.critic_score ? "var(--bulle)" : "var(--border)"}
                    stroke="none"
                  />
                ))}
              </div>
              <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
                Note des experts
              </div>
            </div>
            <div
              className="rounded-2xl p-3 text-center"
              style={{ background: "var(--paper-2)" }}
            >
              {myRating != null ? (
                <div className="text-2xl font-black" style={{ color: "var(--rouge)" }}>
                  {myRating}/5
                </div>
              ) : (
                <div className="text-2xl font-black" style={{ color: "var(--border)" }}>
                  —
                </div>
              )}
              <div className="flex justify-center gap-0.5 my-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-3 h-3"
                    fill={myRating && i <= myRating ? "var(--bulle)" : "var(--border)"}
                    stroke="none"
                  />
                ))}
              </div>
              <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
                {myRating ? "Ma note" : "Pas encore noté"}
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 6 : Profil gustatif ──────────────────────────────────── */}
        {(isLoading || enrichment?.taste_profile) && (
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--ink-soft)" }}
            >
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

        {/* ── Section 7 : Accords mets ──────────────────────────────────────── */}
        {(isLoading || (enrichment?.food_pairings && enrichment.food_pairings.length > 0)) && (
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--ink-soft)" }}
            >
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
                    className="text-xs font-medium px-3 py-1.5 rounded-full"
                    style={{
                      background: "rgba(179,58,46,0.1)",
                      color: "var(--rouge)",
                    }}
                  >
                    {pairing}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Section 8 : Prix estimé ───────────────────────────────────────── */}
        {(isLoading || hasPrice) && (
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--ink-soft)" }}
            >
              Prix estimé
            </div>
            {isLoading ? (
              <div className="rounded-2xl p-3" style={{ background: "var(--paper-2)" }}>
                <SkeletonLine className="h-3 w-20 mb-2" />
                <SkeletonLine className="h-5 w-16" />
              </div>
            ) : hasPrice ? (
              <div className="rounded-2xl p-3" style={{ background: "var(--paper-2)" }}>
                <div className="text-base font-black" style={{ color: "var(--rouge)" }}>
                  {priceMin === priceMax ? `${priceMin}€` : `${priceMin}–${priceMax}€`}
                </div>
                <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
                  / bouteille
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ── Relancer l'analyse IA (vin déjà enrichi) ─────────────────── */}
        {canReEnrich && canUseEnrich && (
          <div className="mx-5 mt-2 mb-1">
            {confirmReEnrich ? (
              <div
                className="rounded-2xl p-3 flex flex-col gap-2"
                style={{ background: "var(--paper-2)", border: "var(--border-hard)" }}
              >
                <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
                  Relancer l&rsquo;analyse ? Cela remplace les données actuelles.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmReEnrich(false)}
                    className="flex-1 rounded-xl py-2 text-xs font-semibold"
                    style={{ background: "var(--bg)", border: "var(--border-hard)", color: "var(--ink-soft)" }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      setConfirmReEnrich(false)
                      void enrich()
                    }}
                    className="flex-1 rounded-xl py-2 text-xs font-bold"
                    style={{ background: "var(--rouge)", color: "var(--rouge-fg)" }}
                  >
                    Relancer
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReEnrich(true)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-semibold"
                style={{ background: "var(--paper-2)", border: "var(--border-hard)", color: "var(--ink-soft)" }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Relancer l&rsquo;analyse
              </button>
            )}
          </div>
        )}

        <div className="h-24" />
      </div>

      {/* ── Actions fixes en bas ───────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 flex gap-3 px-4 pt-3"
        style={{
          background: "var(--bg)",
          borderTop: "1px solid var(--border)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        }}
      >
        <button
          onClick={onActionsOpen}
          className="flex-1 rounded-2xl py-3.5 text-sm font-semibold"
          style={{ background: "var(--paper-2)", color: "var(--ink-soft)" }}
        >
          {actionsLabel}
        </button>
        <button
          onClick={onConsume}
          className="flex-[1.5] rounded-2xl py-3.5 text-sm font-bold"
          style={{ background: "var(--rouge)", color: "var(--rouge-fg)" }}
        >
          − Consommer
        </button>
      </div>
    </div>
  )
}
