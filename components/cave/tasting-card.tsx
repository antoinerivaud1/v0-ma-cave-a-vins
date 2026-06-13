"use client"

import { sanitizeWineName } from "@/lib/wine-helpers"
import { Stars } from "@/components/cave/synthese/stars"
import { Watermark } from "@/components/cave/synthese/watermark"
import type { Tasting } from "@/hooks/use-tastings"

interface TastingCardProps {
  tasting: Tasting
}

const wineSurface: Record<string, { bg: string; fg: string; label: string }> = {
  wine_red:       { bg: "var(--rouge)", fg: "var(--rouge-fg)", label: "rouge" },
  wine_white:     { bg: "var(--blanc)", fg: "var(--blanc-fg)", label: "blanc" },
  wine_sparkling: { bg: "var(--bulle)", fg: "var(--bulle-fg)", label: "bulle" },
  wine_rose:      { bg: "var(--rose)",  fg: "var(--rose-fg)",  label: "rosé"  },
}

const fallbackSurface = { bg: "var(--paper-2)", fg: "var(--ink)", label: "vin" }

function formatDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    .replace(".", "")
    .toUpperCase()
}

export function TastingCard({ tasting }: TastingCardProps) {
  const surf = (tasting.wine_type ? wineSurface[tasting.wine_type] : undefined) ?? fallbackSurface
  const wineName = sanitizeWineName(tasting.wine_name) || "Vin inconnu"

  const sub = [tasting.appellation, tasting.millesime ? String(tasting.millesime) : null]
    .filter(Boolean)
    .join(" · ")

  return (
    <div
      style={{
        background: surf.bg,
        color: surf.fg,
        border: "var(--border-hard)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-hard)",
        padding: 14,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <Watermark color={surf.fg} opacity={0.16}>{surf.label}</Watermark>

      {/* Header: date kicker + stars */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: surf.fg,
              opacity: 0.7,
              textTransform: "uppercase",
            }}
          >
            {formatDate(tasting.tasted_at)}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 19,
              lineHeight: 1.1,
              marginTop: 3,
              color: surf.fg,
            }}
          >
            {wineName}
          </div>
          {sub && (
            <div
              style={{
                fontSize: 10,
                opacity: 0.75,
                marginTop: 3,
                fontFamily: "var(--font-sans)",
              }}
            >
              {sub}
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0, paddingTop: 2 }}>
          <Stars n={tasting.stars} size={13} color={surf.fg} />
        </div>
      </div>

      {/* Comment / quote */}
      {tasting.comment && (
        <p
          style={{
            position: "relative",
            zIndex: 1,
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 14,
            lineHeight: 1.3,
            color: surf.fg,
            opacity: 0.95,
            borderTop: `1px solid ${surf.fg}`,
            paddingTop: 8,
            marginTop: 4,
          }}
        >
          &laquo; {tasting.comment} &raquo;
        </p>
      )}

      {/* Web score */}
      {tasting.web_score && (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontFamily: "var(--font-sans)",
            opacity: 0.85,
            borderTop: `1px solid ${surf.fg}`,
            paddingTop: 8,
            marginTop: tasting.comment ? 0 : 4,
          }}
        >
          <Stars n={1} size={11} color={surf.fg} />
          <span style={{ fontWeight: 700 }}>
            {tasting.web_score}
            {tasting.web_source && ` · ${tasting.web_source}`}
          </span>
        </div>
      )}
    </div>
  )
}
