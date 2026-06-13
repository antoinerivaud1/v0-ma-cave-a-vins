"use client"

import { useState, useMemo } from "react"
import { useTastings } from "@/hooks/use-tastings"
import { TastingCard } from "./tasting-card"
import { TastingSheet } from "./tasting-sheet"
import { BigTile } from "@/components/cave/synthese/big-tile"
import { Stars } from "@/components/cave/synthese/stars"
import type { TastingInput } from "@/hooks/use-tastings"

export function TastingScreen() {
  const { listTastings, saveTasting, isLoaded } = useTastings()
  const [sheetOpen, setSheetOpen] = useState(false)

  const tastings = listTastings()

  const { count, avgStars } = useMemo(() => {
    if (tastings.length === 0) return { count: 0, avgStars: null }
    const count = tastings.length
    const avgStars = tastings.reduce((s, t) => s + t.stars, 0) / count
    return { count, avgStars }
  }, [tastings])

  const handleSave = async (input: TastingInput) => {
    await saveTasting(input)
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "var(--rouge)", borderTopColor: "transparent" }}
        />
      </div>
    )
  }

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{ background: "var(--bg)", color: "var(--ink)" }}
    >
      {/* Header */}
      <div
        style={{
          paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))",
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 0,
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--ink-soft)",
          }}
        >
          Carnet de dégustation
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 28,
            lineHeight: 1.1,
            marginTop: 4,
            color: "var(--ink)",
          }}
        >
          Ce que j&rsquo;ai goûté.
        </h1>

        {/* Stats BigTiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
          <BigTile
            bg="var(--rouge)"
            fg="var(--rouge-fg)"
            label="DÉGUSTÉS"
            big={String(count)}
            sub="bouteilles ouvertes"
            shadow
            accent
          />
          <BigTile
            bg="var(--paper-2)"
            fg="var(--ink)"
            label="NOTE MOYENNE"
            big={avgStars !== null ? `★ ${avgStars.toFixed(1)}` : "—"}
            sub={avgStars !== null
              ? (<Stars n={Math.round(avgStars)} size={11} color="var(--apogee)" />)
              : "pas encore de notes"}
            shadow={false}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-4 py-4">
        {tastings.length === 0 ? (
          <div style={{ marginTop: 8 }}>
            <BigTile
              bg="var(--bg)"
              fg="var(--ink-soft)"
              label="CARNET VIDE"
              big=""
              sub="Notez vos vins depuis leur fiche ou avec le bouton ci-dessous"
              shadow={false}
              style={{
                border: "2px dashed var(--ink-faint)",
                boxShadow: "none",
                minHeight: 120,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
              }}
            >
              Dernières dégustations
            </div>
            {tastings.map((tasting) => (
              <TastingCard key={tasting.id} tasting={tasting} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setSheetOpen(true)}
        style={{
          position: "fixed",
          bottom: "calc(76px + env(safe-area-inset-bottom, 20px) + 12px)",
          right: 16,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          borderRadius: 999,
          background: "var(--rouge)",
          color: "var(--rouge-fg)",
          border: "var(--border-hard)",
          boxShadow: "var(--shadow-accent)",
          padding: "12px 18px",
          fontSize: 14,
          fontWeight: 700,
          fontFamily: "var(--font-sans)",
          zIndex: 40,
          cursor: "pointer",
        }}
      >
        + Nouvelle dégustation
      </button>

      <TastingSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleSave}
      />
    </div>
  )
}
