"use client"

import type { ReactNode } from "react"
import { isEnabled, isComingSoon } from "@/lib/feature-flags"

/* ── ComingSoonBadge ─────────────────────────────── */

interface ComingSoonBadgeProps {
  label?: string
}

export function ComingSoonBadge({ label = "Bientôt" }: ComingSoonBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-800/40 bg-amber-950/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-amber-400">
      {label}
    </span>
  )
}

/* ── ComingSoonOverlay ───────────────────────────── */

interface ComingSoonOverlayProps {
  children: ReactNode
  featureKey: string
}

export function ComingSoonOverlay({ children, featureKey }: ComingSoonOverlayProps) {
  if (isEnabled(featureKey)) {
    return <>{children}</>
  }

  if (isComingSoon(featureKey)) {
    return (
      <div className="relative">
        {/* Contenu désactivé visuellement */}
        <div className="pointer-events-none select-none opacity-50">
          {children}
        </div>
        {/* Absorbe tous les clics */}
        <div className="absolute inset-0 cursor-not-allowed" />
        {/* Badge superposé */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <ComingSoonBadge />
        </div>
      </div>
    )
  }

  // status: "disabled" → rien n'est rendu
  return null
}

/* ── PremiumBadge ────────────────────────────────── */

export function PremiumBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-[#722F37]/50 bg-[#722F37]/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-[#C0956C]">
      Premium
    </span>
  )
}
