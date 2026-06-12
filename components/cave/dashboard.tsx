"use client"

import { useMemo, useState } from "react"
import { Wine, Plus, Camera, PenLine, X, ChevronDown } from "lucide-react"
import { BigTile } from "./synthese/big-tile"
import { StatPill } from "./synthese/stat-pill"
import { Watermark } from "./synthese/watermark"
import { AddWineSheet } from "./add-wine-sheet"
import { ScanLabelSheet } from "./scan-label-sheet"
import { PaywallSheet } from "./paywall-sheet"
import { ComingSoonOverlay } from "./coming-soon-badge"
import { getApogee } from "@/data/apogee"
import { getDailyTip } from "@/data/wine-tips"
import { useAuth } from "@/hooks/use-auth"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useStockOverrides } from "@/hooks/use-stock-overrides"
import { getEffectiveWineState } from "@/lib/stock-overrides"
import { sanitizeWineName } from "@/lib/wine-helpers"
import type { Wine as WineType } from "@/data/apogee"
import type { TabId } from "./bottom-nav"
import type { CaveListProps } from "./cave-list"
import type { Cave } from "@/hooks/use-caves"

interface DashboardProps {
  cave: WineType[]
  onNavigate: (tab: TabId, filter?: CaveListProps["initialFilter"]) => void
  onAddWine: (wine: WineType) => void
  activeCave?: Cave | null
  caveCount?: number
  onCaveSwitch?: () => void
}

function getGreeting(firstName?: string): string {
  const hour = new Date().getHours()
  const salut = hour < 18 ? "Bonjour" : "Bonsoir"
  return firstName ? `${salut}, ${firstName} !` : `${salut} !`
}

export function Dashboard({ cave, onNavigate, onAddWine, activeCave, caveCount, onCaveSwitch }: DashboardProps) {
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showScanSheet, setShowScanSheet] = useState(false)
  const [showScanPaywall, setShowScanPaywall] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const { isPremium } = useAuth()
  const { getOverrideForWine } = useStockOverrides()
  const { profile } = useUserProfile()
  const tip = getDailyTip()

  const stats = useMemo(() => {
    const active = cave.filter((w) => {
      return getEffectiveWineState(w, getOverrideForWine(w)).isVisible
    })
    const total = active.reduce((s, w) => s + getEffectiveWineState(w, getOverrideForWine(w)).quantity, 0)
    const reds = active.filter((w) => w.wine_type === "wine_red" || w.wine_color === "Rouge")
      .reduce((s, w) => s + getEffectiveWineState(w, getOverrideForWine(w)).quantity, 0)
    const whites = active.filter((w) => w.wine_type === "wine_white" || w.wine_color === "Blanc")
      .reduce((s, w) => s + getEffectiveWineState(w, getOverrideForWine(w)).quantity, 0)
    const sparkling = active.filter((w) =>
      w.wine_type === "wine_white_sparkling" || w.wine_color === "Petillant" || w.wine_color === "Effervescent"
    ).reduce((s, w) => s + getEffectiveWineState(w, getOverrideForWine(w)).quantity, 0)
    const toDrink = active.filter((w) => {
      const a = getApogee(w)
      return a && (a.st === "urgent" || a.st === "late")
    })
    const recent = active.filter((w) => (w as any)._manual).slice(0, 3)
    return { total, reds, whites, sparkling, toDrink, recent }
  }, [cave, getOverrideForWine])

  const handleFabAction = (action: "scan" | "manual") => {
    setFabOpen(false)
    if (action === "scan") {
      if (isPremium) {
        setShowScanSheet(true)
      } else {
        setShowScanPaywall(true)
      }
    }
    if (action === "manual") setShowAddSheet(true)
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--bg)" }}>
      <div style={{ paddingTop: "env(safe-area-inset-top, 0px)" }} />

      {/* Header salutation */}
      <div className="flex items-center justify-between px-4 pt-5 pb-1">
        <div>
          {/* Kicker date */}
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              marginBottom: 2,
            }}
          >
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 32,
              lineHeight: 1.05,
              color: "var(--ink)",
            }}
          >
            {getGreeting(profile?.firstName)}
          </h1>
        </div>
        {profile?.firstName && (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--ink)",
              color: "var(--bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: 12,
              border: "var(--border-hard)",
              flexShrink: 0,
            }}
          >
            {profile.firstName.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Nom de la cave active */}
      {activeCave && (caveCount ?? 0) > 0 && (
        <div className="px-4 pb-2">
          {(caveCount ?? 0) >= 2 && onCaveSwitch ? (
            <button
              onClick={onCaveSwitch}
              className="flex items-center gap-1"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                color: "var(--ink-soft)",
              }}
            >
              {sanitizeWineName(activeCave.name)}
              <ChevronDown className="h-3 w-3" />
            </button>
          ) : (
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                color: "var(--ink-soft)",
              }}
            >
              {sanitizeWineName(activeCave.name)}
            </span>
          )}
        </div>
      )}

      {/* Hero — EN CAVE */}
      <div className="px-4 mt-3">
        <BigTile
          bg="var(--rouge)"
          fg="var(--rouge-fg)"
          watermark="cave"
          label="EN CAVE"
          big={stats.total}
          sub="bouteilles"
          accent
          onClick={() => onNavigate("liste")}
        >
          {/* Wine type chips */}
          {(stats.reds > 0 || stats.whites > 0 || stats.sparkling > 0) && (
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 12,
                flexWrap: "wrap",
                position: "relative",
                zIndex: 1,
              }}
            >
              {stats.reds > 0 && (
                <MiniChip label={`${stats.reds} rouges`} fg="var(--rouge-fg)" />
              )}
              {stats.whites > 0 && (
                <MiniChip label={`${stats.whites} blancs`} fg="var(--rouge-fg)" />
              )}
              {stats.sparkling > 0 && (
                <MiniChip label={`${stats.sparkling} bulles`} fg="var(--rouge-fg)" />
              )}
            </div>
          )}
        </BigTile>
      </div>

      {/* Grid — À BOIRE + type répartition */}
      <div
        className="px-4 mt-2.5"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
      >
        {/* À boire */}
        <BigTile
          bg="var(--paper-2)"
          fg="var(--ink)"
          watermark="ouvrir"
          label="À BOIRE"
          big={stats.toDrink.length}
          sub="à leur apogée"
          onClick={stats.toDrink.length > 0 ? () => onNavigate("liste", { level: "drink" }) : undefined}
        />
        {/* StatPills rouges / blancs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <StatPill
            label="Rouges"
            big={stats.reds}
            sub={stats.total > 0 ? `${Math.round((stats.reds / stats.total) * 100)}%` : undefined}
          />
          <StatPill
            label="Blancs"
            big={stats.whites}
            sub={stats.total > 0 ? `${Math.round((stats.whites / stats.total) * 100)}%` : undefined}
          />
        </div>
      </div>

      {/* À boire maintenant — liste détaillée */}
      {stats.toDrink.length > 0 && (
        <section className="mt-4 px-4">
          <div className="mb-2 flex items-center justify-between">
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
              }}
            >
              À BOIRE MAINTENANT
            </h2>
            {stats.toDrink.length > 3 && (
              <button
                onClick={() => onNavigate("liste", { level: "drink" })}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "var(--rouge)",
                }}
              >
                Voir tout ({stats.toDrink.length})
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.toDrink.slice(0, 3).map((wine, i) => {
              const apogee = getApogee(wine)
              const isUrgent = apogee?.st === "urgent"
              return (
                <div
                  key={`drink-${wine.wine_name}-${i}`}
                  style={{
                    background: isUrgent ? "var(--rouge)" : "var(--paper-2)",
                    color: isUrgent ? "var(--rouge-fg)" : "var(--ink)",
                    border: "var(--border-hard)",
                    borderRadius: "var(--radius-card)",
                    boxShadow: isUrgent ? "var(--shadow-accent)" : "var(--shadow-hard)",
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Watermark color={isUrgent ? "var(--rouge-fg)" : "var(--ink)"} size={28}>
                    {isUrgent ? "urgent" : "bientôt"}
                  </Watermark>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <p
                      className="truncate"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontStyle: "italic",
                        fontWeight: 500,
                        fontSize: 15,
                        lineHeight: 1.1,
                        color: isUrgent ? "var(--rouge-fg)" : "var(--ink)",
                      }}
                    >
                      {sanitizeWineName(wine.wine_name) || sanitizeWineName(wine.wine_appellation) || "Vin inconnu"}
                    </p>
                    <p
                      style={{
                        fontSize: 10,
                        color: isUrgent ? "var(--rouge-fg)" : "var(--ink-soft)",
                        opacity: 0.85,
                        marginTop: 2,
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                        {wine.millesime_year}
                      </span>
                      {wine.wine_region ? ` · ${sanitizeWineName(wine.wine_region)}` : ""}
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      padding: "4px 8px",
                      border: `1.5px solid ${isUrgent ? "var(--rouge-fg)" : "var(--ink)"}`,
                      borderRadius: 999,
                      color: isUrgent ? "var(--rouge-fg)" : "var(--ink)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {isUrgent ? "URGENT" : "APOGÉE"}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Ajouts récents */}
      {stats.recent.length > 0 && (
        <section className="mt-4 px-4">
          <h2
            className="mb-2"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
            }}
          >
            AJOUTS RÉCENTS
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.recent.map((wine, i) => (
              <div
                key={`recent-${wine.wine_name}-${i}`}
                style={{
                  background: "var(--paper-2)",
                  color: "var(--ink)",
                  border: "var(--border-hard)",
                  borderRadius: "var(--radius-card)",
                  boxShadow: "var(--shadow-hard)",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p
                    className="truncate"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontWeight: 500,
                      fontSize: 15,
                      lineHeight: 1.1,
                      color: "var(--ink)",
                    }}
                  >
                    {sanitizeWineName(wine.wine_name) || "Vin inconnu"}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: "var(--ink-soft)",
                      marginTop: 2,
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {wine.millesime_year}
                    </span>
                    {wine.wine_region ? ` · ${sanitizeWineName(wine.wine_region)}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Le saviez-vous */}
      <div className="px-4 mt-4">
        <BigTile
          bg="var(--paper-2)"
          fg="var(--ink)"
          label={tip.type === "personal" ? "VOTRE CAVE" : "LE SAVIEZ-VOUS ?"}
          shadow={false}
          style={{
            border: "1.5px dashed var(--ink)",
            boxShadow: "none",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 17,
              lineHeight: 1.35,
              marginTop: 6,
              color: "var(--ink)",
            }}
          >
            {tip.text}
          </p>
          <div style={{ marginTop: 8 }}>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 10,
                fontStyle: "italic",
                color: "var(--ink-soft)",
              }}
            >
              — votre sommelier
            </span>
          </div>
        </BigTile>
      </div>

      {/* Empty state */}
      {stats.total === 0 && (
        <div className="mx-4 mt-4">
          <BigTile bg="var(--paper-2)" fg="var(--ink)" shadow={false} style={{ border: "1.5px dashed var(--ink)", textAlign: "center" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                padding: "8px 0",
              }}
            >
              <Wine style={{ width: 32, height: 32, color: "var(--ink-soft)", opacity: 0.5 }} />
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: 18,
                  color: "var(--ink)",
                }}
              >
                Cave vide
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  color: "var(--ink-soft)",
                }}
              >
                Scannez ou ajoutez votre première bouteille.
              </p>
            </div>
          </BigTile>
        </div>
      )}

      {/* Spacer for FAB + bottom nav */}
      <div style={{ height: "calc(120px + env(safe-area-inset-bottom, 0px))" }} />

      {/* FAB overlay */}
      {fabOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setFabOpen(false)} />
      )}

      {/* FAB menu */}
      {fabOpen && (
        <div
          className="fixed right-4 z-30 flex flex-col items-end gap-2"
          style={{
            bottom: "calc(160px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <ComingSoonOverlay featureKey="SCAN_LABEL">
            <button
              onClick={() => handleFabAction("scan")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--bg)",
                color: "var(--ink)",
                border: "var(--border-hard)",
                borderRadius: 999,
                padding: "10px 16px",
                boxShadow: "var(--shadow-hard)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <span>Scanner une étiquette</span>
              <Camera className="h-4 w-4" style={{ color: "var(--rouge)" }} />
            </button>
          </ComingSoonOverlay>
          <button
            onClick={() => handleFabAction("manual")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "var(--bg)",
              color: "var(--ink)",
              border: "var(--border-hard)",
              borderRadius: 999,
              padding: "10px 16px",
              boxShadow: "var(--shadow-hard)",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span>Ajouter manuellement</span>
            <PenLine className="h-4 w-4" style={{ color: "var(--ink-soft)" }} />
          </button>
        </div>
      )}

      {/* FAB bouton principal */}
      <button
        onClick={() => setFabOpen(!fabOpen)}
        className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center transition-transform active:scale-95"
        style={{
          bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
          background: "var(--rouge)",
          color: "var(--rouge-fg)",
          border: "var(--border-hard)",
          borderRadius: "var(--radius-fab)",
          boxShadow: "var(--shadow-accent)",
        }}
        aria-label="Ajouter un vin"
      >
        {fabOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>

      <AddWineSheet isOpen={showAddSheet} onOpenChange={setShowAddSheet} onAdd={onAddWine} />
      <ScanLabelSheet isOpen={showScanSheet} onOpenChange={setShowScanSheet} onAdd={onAddWine} />
      <PaywallSheet
        isOpen={showScanPaywall}
        onOpenChange={setShowScanPaywall}
        featureName="Scanner une étiquette avec l'IA"
        featureDescription="Identifiez instantanément n'importe quel vin en photographiant son étiquette. Obtenez le nom, le millésime, la région et l'appellation en quelques secondes."
        planRequired="amateur"
        planPrice="3,49 €/mois"
        onManualAdd={() => setShowAddSheet(true)}
      />
    </div>
  )
}

/* ─── MiniChip ─── */
function MiniChip({ label, fg }: { label: string; fg: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: 10,
        fontWeight: 600,
        color: fg,
        padding: "3px 8px",
        border: `1.5px solid ${fg}`,
        borderRadius: 999,
        opacity: 0.9,
      }}
    >
      {label}
    </span>
  )
}
