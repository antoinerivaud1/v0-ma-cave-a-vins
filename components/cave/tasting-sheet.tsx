"use client"

import { useState } from "react"
import { Star, Loader2, Camera } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScanLabelSheet } from "./scan-label-sheet"
import { PaywallSheet } from "./paywall-sheet"
import { useAuth } from "@/hooks/use-auth"
import { sanitizeWineName } from "@/lib/wine-helpers"
import type { TastingInput } from "@/hooks/use-tastings"

interface TastingSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (input: TastingInput) => Promise<void>
}

type Step = "identify" | "rate" | "comment"

interface WineData {
  wine_name: string
  millesime: string | null
  region: string | null
  appellation: string | null
  wine_type: string | null
}

export function TastingSheet({ open, onOpenChange, onSave }: TastingSheetProps) {
  const { isPremium } = useAuth()
  const [step, setStep] = useState<Step>("identify")
  const [scanOpen, setScanOpen] = useState(false)
  const [showScanPaywall, setShowScanPaywall] = useState(false)
  const [wineData, setWineData] = useState<WineData | null>(null)
  const [manualName, setManualName] = useState("")
  const [manualMillesime, setManualMillesime] = useState("")
  const [stars, setStars] = useState<number>(0)
  const [hovered, setHovered] = useState<number>(0)
  const [comment, setComment] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const resetState = () => {
    setStep("identify")
    setWineData(null)
    setManualName("")
    setManualMillesime("")
    setStars(0)
    setHovered(0)
    setComment("")
    setIsSaving(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) resetState()
    onOpenChange(open)
  }

  const handleScanResult = (wine: { wine_name?: string; millesime_year?: string | number; wine_region?: string; wine_appellation?: string; wine_type?: string }) => {
    setWineData({
      wine_name: sanitizeWineName(wine.wine_name) || "Vin inconnu",
      millesime: wine.millesime_year ? String(wine.millesime_year) : null,
      region: wine.wine_region ?? null,
      appellation: wine.wine_appellation ?? null,
      wine_type: wine.wine_type ?? null,
    })
    setScanOpen(false)
    setStep("rate")
  }

  const handleManualNext = () => {
    if (!manualName.trim()) return
    setWineData({
      wine_name: sanitizeWineName(manualName.trim()) || manualName.trim(),
      millesime: manualMillesime.trim() || null,
      region: null,
      appellation: null,
      wine_type: null,
    })
    setStep("rate")
  }

  const handleSave = async () => {
    if (!wineData || stars === 0) return
    setIsSaving(true)
    try {
      await onSave({
        wine_name: wineData.wine_name,
        millesime: wineData.millesime,
        region: wineData.region,
        appellation: wineData.appellation,
        wine_type: wineData.wine_type,
        stars,
        comment,
        web_score: null,
        web_source: null,
        web_summary: null,
        cave_wine_ref: null,
      })
      handleOpenChange(false)
    } catch (error) {
      console.error("[TastingSheet] Failed to save tasting:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[90dvh] flex flex-col rounded-t-2xl z-[60]"
          onPointerDownOutside={(e) => {
            if (scanOpen || showScanPaywall) e.preventDefault()
          }}
        >
          <SheetHeader className="flex-shrink-0">
            <SheetTitle className="text-left">Nouvelle dégustation</SheetTitle>
          </SheetHeader>

          <div className="overflow-y-auto flex-1 px-1 pb-4">

            {/* STEP 1 — Identifier le vin */}
            {step === "identify" && (
              <div className="flex flex-col gap-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Ce vin ne sera pas ajouté à ta cave automatiquement.
                </p>

                {/* Scanner */}
                <button
                  onClick={() => {
                    if (isPremium) {
                      setScanOpen(true)
                    } else {
                      setShowScanPaywall(true)
                    }
                  }}
                  className="flex items-center gap-3 rounded-xl border border-cave-border bg-card px-4 py-3 text-left"
                >
                  <Camera className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Scanner l&apos;étiquette</p>
                    <p className="text-xs text-muted-foreground">Identification automatique par IA</p>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-cave-border" />
                  <span className="text-xs text-muted-foreground">ou</span>
                  <div className="h-px flex-1 bg-cave-border" />
                </div>

                {/* Saisie manuelle */}
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Nom du vin"
                    className="rounded-md border border-cave-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={manualMillesime}
                    onChange={(e) => setManualMillesime(e.target.value)}
                    placeholder="Millésime (optionnel)"
                    className="rounded-md border border-cave-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={handleManualNext}
                    disabled={!manualName.trim()}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
                  >
                    Continuer
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — Évaluer */}
            {step === "rate" && wineData && (
              <div className="flex flex-col gap-4 pt-2">
                <div className="rounded-lg border border-cave-border bg-muted/20 px-3 py-2.5">
                  <p className="font-cormorant text-base text-foreground">
                    {wineData.wine_name}
                    {wineData.millesime && (
                      <span className="ml-1.5 font-sans text-sm font-semibold text-muted-foreground">
                        {wineData.millesime}
                      </span>
                    )}
                  </p>
                  {wineData.region && (
                    <p className="text-xs text-muted-foreground">{wineData.region}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">Votre note</p>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setStars(i)}
                        className="p-1 touch-manipulation"
                        aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${
                            i <= (hovered || stars)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setStep("comment")}
                  disabled={stars === 0}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
                >
                  Continuer
                </button>
              </div>
            )}

            {/* STEP 3 — Commentaire + save */}
            {step === "comment" && wineData && (
              <div className="flex flex-col gap-4 pt-2">
                <div className="rounded-lg border border-cave-border bg-muted/20 px-3 py-2.5">
                  <p className="font-cormorant text-base text-foreground">
                    {wineData.wine_name}
                    {wineData.millesime && (
                      <span className="ml-1.5 font-sans text-sm font-semibold text-muted-foreground">
                        {wineData.millesime}
                      </span>
                    )}
                  </p>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i <= stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Notes de dégustation, impressions... (optionnel)"
                  rows={4}
                  className="w-full resize-none rounded-md border border-cave-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    "Sauvegarder la dégustation"
                  )}
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Scanner réutilisé */}
      <ScanLabelSheet
        isOpen={scanOpen}
        onOpenChange={setScanOpen}
        onAdd={handleScanResult}
      />
      <PaywallSheet
        isOpen={showScanPaywall}
        onOpenChange={setShowScanPaywall}
        featureName="Scanner une étiquette avec l'IA"
        featureDescription="Identifiez et enrichissez instantanément un vin pour votre carnet de dégustation."
        planRequired="amateur"
        planPrice="3,49 €/mois"
      />
    </>
  )
}
