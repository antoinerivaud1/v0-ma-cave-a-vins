"use client"
import { useState } from "react"
import { ChevronDown, MessageSquare } from "lucide-react"
import { CaveBadge } from "./cave-badge"
import { WineExpertPanel } from "./wine-expert-panel"
import { WineCardActions } from "./wine-card-actions"
import { useStockOverrides } from "@/hooks/use-stock-overrides"
import { getEffectiveWineState } from "@/lib/stock-overrides"
import { getIcon, getLabel, getColor, formatRegion, sanitizeWineName } from "@/lib/wine-helpers"
import { getApogee } from "@/data/apogee"
import { useWineEnrichment } from "@/hooks/use-wine-enrichment"
import { WineEnrichmentPanel } from "./wine-enrichment-panel"
import { useTastings } from "@/hooks/use-tastings"
import { TastingPanel } from "./tasting-panel"
import type { Wine } from "@/data/apogee"
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
  onWineUpdate?: (updates: Partial<Wine>) => void
  onMoved?: () => void
}

const colorDotClasses: Record<string, string> = {
  red: "bg-red-500",
  white: "bg-amber-200",
  sparkling: "bg-sky-300",
  unknown: "bg-muted-foreground",
}

const colorBadgeVariant: Record<string, "gold" | "muted"> = {
  red: "gold",
  white: "muted",
  sparkling: "muted",
  unknown: "muted",
}

export function WineCard({ wine, onWineUpdate, onMoved }: WineCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showLastBottleDialog, setShowLastBottleDialog] = useState(false)
  const { getOverrideForWine, setOverrideForWine } = useStockOverrides()

  const isManual = !!(wine._manual as boolean | undefined)
  const { getEnrichment, isEnriching } = useWineEnrichment()
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

  const apogee = getApogee(wine)
  const color = getColor(wine.wine_type || "")
  const icon = getIcon(wine.wine_type || "")
  const label = getLabel(wine.wine_type || "")
  const region = formatRegion(wine.wine_region || "")
  const hasNote = !!(wine.bottle_comment || wine.wine_comment || wine.wine_notes)
  const note = String(wine.bottle_comment || wine.wine_comment || wine.wine_notes || "")
  const override = getOverrideForWine(wine)
  const effectiveState = getEffectiveWineState(wine, override)
  const displayQuantity = effectiveState.quantity
  const isArchived = effectiveState.archived
  const apogeeBadgeVariant = apogee
    ? (apogee.st as "urgent" | "ok" | "wait" | "late")
    : undefined

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
    setOverrideForWine(wine, { ...override, archived: false })
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
    <div className="relative overflow-hidden rounded-xl border border-cave-border bg-card">
      <div className="flex w-full items-center gap-3 px-3.5 py-3">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex flex-1 items-center gap-3 text-left min-w-0"
          aria-expanded={isOpen}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${colorDotClasses[color]}/15`}
            aria-hidden="true"
          >
            {icon}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate font-cormorant text-base font-normal text-foreground">
              {sanitizeWineName(wine.wine_name) || sanitizeWineName(wine.wine_appellation) || "Vin inconnu"}
              {wine.millesime_year ? (
                <span className="ml-1.5 font-sans font-semibold tabular-nums text-lg text-muted-foreground">
                  {wine.millesime_year}
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {wine.wine_domain ? sanitizeWineName(wine.wine_domain) : ""}
              {wine.wine_domain && region ? " · " : ""}
              {region}
              {displayQuantity > 1 ? (
                <span className="ml-1 text-primary">{` x${displayQuantity}`}</span>
              ) : null}
            </p>
          </div>

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
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
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 px-3.5 pb-3">
        <CaveBadge label={`${icon} ${label}`} variant={colorBadgeVariant[color]} />
        {apogee && apogeeBadgeVariant && (
          <CaveBadge label={apogee.label} variant={apogeeBadgeVariant} />
        )}
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-cave-border px-3.5 py-3">
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

            <div className="mt-3">
              <WineExpertPanel
                region={wine.wine_region}
                cepage={typeof wine.wine_classification === "string" ? wine.wine_classification : undefined}
                millesime={wine.millesime_year ? parseInt(String(wine.millesime_year)) : undefined}
                wineName={sanitizeWineName(wine.wine_name) || sanitizeWineName(wine.wine_appellation) || undefined}
              />
            </div>

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
