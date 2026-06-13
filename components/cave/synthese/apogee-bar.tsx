"use client"

/**
 * ApogeeBar — barre segmentée fidèle au prototype (components.jsx l.269)
 * Toujours visible : mode estimé si pas d'enrichissement IA.
 */

import type { UnifiedApogee, UnifiedApogeeStatus } from "@/lib/apogee-unified"

interface ApogeeBarProps {
  unified: UnifiedApogee
  /** Couleur du texte et des bordures — facultatif */
  fg?: string
}

const ZONE_DEFS: { label: string; from: number; to: number; varName: string }[] = [
  { label: "À garder", from: 0, to: 30, varName: "--garde" },
  { label: "Optimal", from: 30, to: 50, varName: "--optimal" },
  { label: "Apogée", from: 50, to: 85, varName: "--apogee" },
  { label: "Urgent", from: 85, to: 100, varName: "--urgent" },
]

const STATUS_LABELS: Record<UnifiedApogeeStatus, string> = {
  garde: "À GARDER",
  optimal: "OPTIMAL",
  apogee: "APOGÉE",
  urgent: "URGENT",
}

const STATUS_COLORS: Record<UnifiedApogeeStatus, string> = {
  garde: "var(--garde)",
  optimal: "var(--optimal)",
  apogee: "var(--apogee)",
  urgent: "var(--urgent)",
}

export function ApogeeBar({ unified, fg = "var(--ink)" }: ApogeeBarProps) {
  const progressPct = Math.round(unified.progress * 100)
  // Position du pic : centre de la zone apogée (67.5%)
  const peakPct = 67.5

  return (
    <div className="flex flex-col gap-2">
      {/* Ligne statut + progression */}
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: STATUS_COLORS[unified.status] }}
        >
          {STATUS_LABELS[unified.status]}
        </span>
        <span
          className="text-[10px] tabular-nums"
          style={{ color: fg, opacity: 0.75 }}
        >
          {progressPct}%
        </span>
      </div>

      {/* Barre segmentée */}
      <div
        className="relative h-[10px] rounded-full overflow-hidden"
        style={{ border: `1.5px solid ${fg}` }}
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Apogée : ${unified.label}`}
      >
        {/* Zones colorées en arrière-plan */}
        <div className="absolute inset-0 flex">
          {ZONE_DEFS.map((zone, i) => (
            <div
              key={zone.label}
              style={{
                flex: zone.to - zone.from,
                background: `var(${zone.varName})`,
                opacity: 0.22,
                borderRight: i < ZONE_DEFS.length - 1 ? `1px solid ${fg}` : "none",
              }}
            />
          ))}
        </div>

        {/* Remplissage jusqu'à la position courante */}
        <div
          className="absolute top-0 left-0 bottom-0"
          style={{
            width: `${progressPct}%`,
            background: fg,
            opacity: 0.85,
            mixBlendMode: "multiply",
          }}
        />

        {/* Marqueur de pic */}
        <span
          className="absolute top-0 bottom-0"
          style={{
            left: `${peakPct}%`,
            width: 2,
            background: fg,
            transform: "translateX(-1px)",
          }}
          aria-hidden
        />
      </div>

      {/* Labels de zone */}
      <div
        className="flex justify-between text-[9px]"
        style={{ color: fg, opacity: 0.7, fontFamily: "var(--font-sans)" }}
      >
        <span>Jeunesse</span>
        <span>Optimal</span>
        <span>Apogée</span>
        <span>Déclin</span>
      </div>

      {/* Fenêtre d'apogée */}
      {unified.start !== null && unified.end !== null && (
        <div
          className="text-xs text-center"
          style={{ color: fg, opacity: 0.8 }}
        >
          Fenêtre{" "}
          <span className="font-bold">
            {unified.start}–{unified.end}
          </span>
          {unified.estimated && (
            <span
              className="ml-1.5 italic"
              style={{ fontFamily: "var(--font-display)", opacity: 0.65 }}
            >
              (estimé)
            </span>
          )}
        </div>
      )}
    </div>
  )
}
