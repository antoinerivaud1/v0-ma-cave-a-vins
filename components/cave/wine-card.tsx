"use client"
import { useState } from "react"
import { ChevronDown, MessageSquare } from "lucide-react"
import { CaveBadge } from "./cave-badge"
import { WineExpertPanel } from "./wine-expert-panel"
import { WineCardActions } from "./wine-card-actions"
import { useStockOverrides } from "@/hooks/use-stock-overrides"
import { getIcon, getLabel, getColor, formatRegion, sanitizeWineName } from "@/lib/wine-helpers"
import { getApogee } from "@/data/apogee"
import type { Wine } from "@/data/apogee"

interface WineCardProps {
  wine: Wine
  onWineUpdate?: (updates: Partial<Wine>) => void
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

export function WineCard({ wine, onWineUpdate }: WineCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { getOverride, setOverride } = useStockOverrides()

  const apogee = getApogee(wine)
  const color = getColor(wine.wine_type || "")
  const icon = getIcon(wine.wine_type || "")
  const label = getLabel(wine.wine_type || "")
  const region = formatRegion(wine.wine_region || "")
  const hasNote = !!(wine.bottle_comment || wine.wine_comment || wine.wine_notes)
  const note = wine.bottle_comment || wine.wine_comment || wine.wine_notes || ""
  const override = getOverride(wine.wine_name, wine.millesime_year)
  const displayQuantity = override?.quantity !== undefined ? override.quantity : (wine.bottle_quantity || 1)
  const isArchived = override?.archived || false
  const apogeeBadgeVariant = apogee
    ? (apogee.st as "urgent" | "ok" | "wait" | "late")
    : undefined

  const handleConsume = () => {
    const newQty = Math.max(0, displayQuantity - 1)
    setOverride(wine.wine_name, wine.millesime_year, { ...override, quantity: newQty })
  }

  const handleArchive = () => {
    setOverride(wine.wine_name, wine.millesime_year, { ...override, archived: true })
  }

  const handleQuantityChange = (qty: number) => {
    setOverride(wine.wine_name, wine.millesime_year, { ...override, quantity: qty })
  }

  const handleRestore = () => {
    setOverride(wine.wine_name, wine.millesime_year, { ...override, archived: false })
  }

  const handleDelete = () => {
    setOverride(wine.wine_name, wine.millesime_year, { ...override, deleted: true })
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-cave-border bg-card">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
        aria-expanded={isOpen}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${colorDotClasses[color]}/15`}
          aria-hidden="true"
        >
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-base font-semibold text-foreground">
            {sanitizeWineName(wine.wine_name) || sanitizeWineName(wine.wine_appellation) || "Vin inconnu"}
            {wine.millesime_year ? (
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
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

        <div className="flex items-center gap-2">
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
          <WineCardActions
            wineName={sanitizeWineName(wine.wine_name) || "Vin inconnu"}
            millesime={wine.millesime_year}
            currentQuantity={displayQuantity}
            isArchived={isArchived}
            onConsume={handleConsume}
            onQuantityChange={handleQuantityChange}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        </div>
      </button>

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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
