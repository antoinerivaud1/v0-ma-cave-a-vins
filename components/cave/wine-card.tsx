"use client"
import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { CaveBadge } from "./cave-badge"
import { WineCardActions } from "./wine-card-actions"
import { useStockOverrides } from "@/hooks/use-stock-overrides"
import { getEffectiveWineState } from "@/lib/stock-overrides"
import { getLabel, getColor, formatRegion, sanitizeWineName } from "@/lib/wine-helpers"
import { getUnifiedApogee, unifiedToLegacySt } from "@/lib/apogee-unified"
import { useWineEnrichmentLegacy } from "@/hooks/use-wine-enrichment"
import { WineEnrichmentPanel } from "./wine-enrichment-panel"
import { useTastings } from "@/hooks/use-tastings"
import { TastingPanel } from "./tasting-panel"
import { Watermark } from "./synthese/watermark"
import type { Wine } from "@/data/apogee"
import type { Cave } from "@/hooks/use-caves"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface WineCardProps {
  wine: Wine
  caves: Cave[]
  onWineSelect?: (wine: Wine) => void
  onWineUpdate?: (updates: Partial<Wine>) => void
  onMoved?: () => void
}

/** CSS token surface per wine color key */
const wineSurface: Record<string, { bg: string; fg: string }> = {
  red:      { bg: "var(--rouge)", fg: "var(--rouge-fg)" },
  white:    { bg: "var(--blanc)", fg: "var(--blanc-fg)" },
  sparkling: { bg: "var(--bulle)", fg: "var(--bulle-fg)" },
  rose:     { bg: "var(--rose)",  fg: "var(--rose-fg)"  },
  unknown:  { bg: "var(--paper-2)", fg: "var(--ink)"    },
}

/** Watermark label per color key */
const watermarkLabel: Record<string, string> = {
  red:      "Rouge",
  white:    "Blanc",
  sparkling: "Bulle",
  rose:     "Rosé",
  unknown:  "Vin",
}

const colorBadgeVariant: Record<string, "gold" | "muted"> = {
  red: "gold",
  white: "muted",
  sparkling: "muted",
  rose: "muted",
  unknown: "muted",
}

export function WineCard({ wine, caves, onWineSelect, onWineUpdate, onMoved }: WineCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showLastBottleDialog, setShowLastBottleDialog] = useState(false)
  const { getOverrideForWine, setOverrideForWine } = useStockOverrides()

  const isManual = !!(wine._manual as boolean | undefined)
  const { getEnrichment, isEnriching } = useWineEnrichmentLegacy()
  const enrichment = isManual
    ? getEnrichment(wine.wine_name ?? "", wine.millesime_year)
    : null
  const enrichmentLoading = isManual
    ? isEnriching(wine.wine_name ?? "", wine.millesime_year)
    : false

  const { getTastingForWine, saveTasting, deleteTasting } = useTastings()
  const [isSavingTasting, setIsSavingTasting] = useState(false)
  const tasting = getTastingForWine(wine.wine_name, wine.millesime_year)

  const caveWineRef = `${wine.wine_name ?? "unknown"}_${wine.millesime_year ?? ""}`

  const handleSaveTasting = async (input: { stars: number; comment: string }) => {
    setIsSavingTasting(true)
    await saveTasting({
      wine_name: sanitizeWineName(wine.wine_name) || "Vin inconnu",
      millesime: wine.millesime_year ? String(wine.millesime_year) : null,
      region: wine.wine_region ?? null,
      appellation: wine.wine_appellation ?? null,
      wine_type: wine.wine_type ?? null,
      stars: input.stars,
      comment: input.comment,
      web_score: enrichment?.notes ?? null,
      web_source: enrichment?.source ?? null,
      web_summary: enrichment?.noteSummary ?? null,
      cave_wine_ref: caveWineRef,
    })
    setIsSavingTasting(false)
  }

  const handleDeleteTasting = async () => {
    if (!tasting) return
    setIsSavingTasting(true)
    await deleteTasting(tasting.id)
    setIsSavingTasting(false)
  }

  const unifiedApogee = getUnifiedApogee(wine)
  const color = getColor(wine.wine_type || "")
  const label = getLabel(wine.wine_type || "")
  const region = formatRegion(wine.wine_region || "")
  const hasNote = !!(wine.bottle_comment || wine.wine_comment || wine.wine_notes)
  const note = String(wine.bottle_comment || wine.wine_comment || wine.wine_notes || "")
  const override = getOverrideForWine(wine)
  const effectiveState = getEffectiveWineState(wine, override)
  const displayQuantity = effectiveState.quantity
  const isArchived = effectiveState.archived
  const apogeeBadgeVariant = unifiedApogee
    ? unifiedToLegacySt(unifiedApogee.status)
    : undefined

  const surf = wineSurface[color] ?? wineSurface.unknown
  const wmLabel = watermarkLabel[color] ?? "Vin"

  const handleConsume = () => {
    const newQty = Math.max(0, displayQuantity - 1)
    setOverrideForWine(wine, { ...override, quantity: newQty })
  }

  const handleArchive = () => {
    setOverrideForWine(wine, { ...override, archived: true })
  }

  const handleQuantityChange = (qty: number) => {
    setOverrideForWine(wine, { ...override, quantity: qty })
  }

  const handleRestore = () => {
    const restoredQty = displayQuantity === 0 ? 1 : displayQuantity
    setOverrideForWine(wine, { ...override, quantity: restoredQty, archived: false })
  }

  const handleDelete = () => {
    setOverrideForWine(wine, { ...override, deleted: true })
  }

  const handleArchiveAfterLastBottle = () => {
    setOverrideForWine(wine, { ...override, quantity: 0, archived: true })
  }

  const handleDeleteAfterLastBottle = () => {
    setOverrideForWine(wine, { ...override, quantity: 0, deleted: true })
  }

  return (
    <>
    <div
      style={{
        background: surf.bg,
        color: surf.fg,
        border: "var(--border-hard)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-hard)",
        position: "relative",
        overflow: "hidden",
        containerType: "inline-size",
      }}
    >
      <Watermark color={surf.fg}>{wmLabel}</Watermark>

      <div className="flex w-full items-center gap-3 px-3.5 py-3" style={{ position: "relative", zIndex: 1 }}>
        <button
          onClick={() => onWineSelect ? onWineSelect(wine) : setIsOpen((prev) => !prev)}
          className="flex flex-1 items-center gap-3 text-left min-w-0"
          aria-expanded={isOpen}
        >
          <div className="min-w-0 flex-1">
            <p
              className="truncate"
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 18,
                lineHeight: 1.1,
                color: surf.fg,
              }}
            >
              {sanitizeWineName(wine.wine_name) || sanitizeWineName(wine.wine_appellation) || "Vin inconnu"}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                marginTop: 3,
                color: surf.fg,
                opacity: 0.85,
                fontFamily: "var(--font-sans)",
              }}
            >
              {wine.millesime_year ? (
                <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {wine.millesime_year}
                </span>
              ) : null}
              {displayQuantity > 1 ? (
                <>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>×{displayQuantity}</span>
                </>
              ) : null}
            </div>
            <p
              className="mt-0.5 truncate"
              style={{ fontSize: 11, color: surf.fg, opacity: 0.7, fontFamily: "var(--font-sans)" }}
            >
              {wine.wine_domain ? sanitizeWineName(wine.wine_domain) : ""}
              {wine.wine_domain && region ? " · " : ""}
              {region}
            </p>
          </div>
        </button>
        <WineCardActions
          wineName={sanitizeWineName(wine.wine_name) || "Vin inconnu"}
          millesime={wine.millesime_year ?? ""}
          currentQuantity={displayQuantity}
          isArchived={isArchived}
          onConsume={handleConsume}
          onLastBottleConsume={() => setShowLastBottleDialog(true)}
          onQuantityChange={handleQuantityChange}
          onArchive={handleArchive}
          onRestore={handleRestore}
          onDelete={handleDelete}
          wineId={wine.id}
          wineCaveId={wine.cave_id}
          onMoved={onMoved}
          caves={caves}
        />
      </div>

      <div
        className="flex flex-wrap items-center gap-1.5 px-3.5 pb-3"
        style={{ position: "relative", zIndex: 1 }}
      >
        <CaveBadge label={label} variant={colorBadgeVariant[color]} />
        {unifiedApogee && apogeeBadgeVariant && (
          <CaveBadge label={unifiedApogee.label} variant={apogeeBadgeVariant} />
        )}
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        style={{ position: "relative", zIndex: 1 }}
      >
        <div className="overflow-hidden">
          <div
            style={{
              borderTop: "var(--border-hard)",
              padding: "12px 14px",
              background: "var(--paper-2)",
              color: "var(--ink)",
            }}
          >
            <TastingPanel
              tasting={tasting}
              isSaving={isSavingTasting}
              onSave={handleSaveTasting}
              onDelete={handleDeleteTasting}
            />

            {hasNote ? (
              <div className="flex items-start gap-2">
                <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <p className="text-sm leading-relaxed text-foreground">{note}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Aucune note pour ce vin.</p>
            )}

            {isManual && (
              <WineEnrichmentPanel
                enrichment={enrichment}
                isLoading={enrichmentLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>

    <AlertDialog open={showLastBottleDialog} onOpenChange={setShowLastBottleDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Derniere bouteille</AlertDialogTitle>
          <AlertDialogDescription>
            Vous avez consomme votre derniere bouteille de{" "}
            {sanitizeWineName(wine.wine_name) || "ce vin"}.
            Que souhaitez-vous faire ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              handleArchiveAfterLastBottle()
              setShowLastBottleDialog(false)
            }}
            className="bg-muted text-foreground hover:bg-muted/80"
          >
            Archiver
          </AlertDialogAction>
          <AlertDialogAction
            onClick={() => {
              handleDeleteAfterLastBottle()
              setShowLastBottleDialog(false)
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
