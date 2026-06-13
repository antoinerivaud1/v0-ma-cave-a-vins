"use client"

import { useState } from "react"
import { Loader2, Camera } from "lucide-react"
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
import { Stars } from "@/components/cave/synthese/stars"
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "var(--border-hard)",
  borderRadius: "var(--radius-card)",
  background: "var(--bg)",
  color: "var(--ink)",
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: "var(--font-sans)",
  outline: "none",
  boxSizing: "border-box",
}

const btnPrimary: React.CSSProperties = {
  width: "100%",
  background: "var(--rouge)",
  color: "var(--rouge-fg)",
  border: "var(--border-hard)",
  borderRadius: "var(--radius-card)",
  boxShadow: "var(--shadow-hard)",
  padding: "12px 18px",
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "var(--font-sans)",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
}

function WineRecap({ wine, stars }: { wine: WineData; stars?: number }) {
  return (
    <div
      style={{
        border: "var(--border-hard)",
        borderRadius: "var(--radius-card)",
        background: "var(--paper-2)",
        color: "var(--ink)",
        padding: "10px 12px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: 17,
          lineHeight: 1.2,
          color: "var(--ink)",
        }}
      >
        {wine.wine_name}
        {wine.millesime && (
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontStyle: "normal",
              fontSize: 13,
              fontWeight: 700,
              marginLeft: 8,
              color: "var(--ink-soft)",
            }}
          >
            {wine.millesime}
          </span>
        )}
      </p>
      {wine.region && (
        <p style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>{wine.region}</p>
      )}
      {stars !== undefined && stars > 0 && (
        <div style={{ marginTop: 6 }}>
          <Stars n={stars} size={13} color="var(--apogee)" />
        </div>
      )}
    </div>
  )
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

  const handleScanResult = (wine: {
    wine_name?: string
    millesime_year?: string | number
    wine_region?: string
    wine_appellation?: string
    wine_type?: string
  }) => {
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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90dvh] flex flex-col rounded-t-2xl z-[60]"
        style={{ background: "var(--bg)", color: "var(--ink)" }}
      >
        <SheetHeader className="flex-shrink-0">
          <SheetTitle
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              textAlign: "left",
            }}
          >
            Nouvelle dégustation
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto flex-1 px-1 pb-4">

          {step === "identify" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 8 }}>
              <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                Ce vin ne sera pas ajouté à ta cave automatiquement.
              </p>

              <button
                onClick={() => {
                  if (isPremium) {
                    setScanOpen(true)
                  } else {
                    setShowScanPaywall(true)
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  border: "var(--border-hard)",
                  borderRadius: "var(--radius-card)",
                  background: "var(--paper-2)",
                  padding: "12px 14px",
                  textAlign: "left",
                  cursor: "pointer",
                  color: "var(--ink)",
                }}
              >
                <Camera style={{ width: 20, height: 20, color: "var(--rouge)", flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                    Scanner l&apos;étiquette
                  </p>
                  <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    Identification automatique par IA
                  </p>
                </div>
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ height: 1, flex: 1, background: "var(--ink-faint)" }} />
                <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>ou</span>
                <div style={{ height: 1, flex: 1, background: "var(--ink-faint)" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Nom du vin"
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={manualMillesime}
                  onChange={(e) => setManualMillesime(e.target.value)}
                  placeholder="Millésime (optionnel)"
                  style={inputStyle}
                />
                <button
                  onClick={handleManualNext}
                  disabled={!manualName.trim()}
                  style={{ ...btnPrimary, opacity: !manualName.trim() ? 0.4 : 1 }}
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {step === "rate" && wineData && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>
              <WineRecap wine={wineData} />

              <div>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--ink-soft)",
                    marginBottom: 12,
                  }}
                >
                  Votre note
                </p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setStars(i)}
                      style={{
                        padding: 4,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: i <= (hovered || stars) ? "var(--apogee)" : "var(--ink-faint)",
                      }}
                      aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
                    >
                      <svg
                        width={32}
                        height={32}
                        viewBox="0 0 24 24"
                        fill={i <= (hovered || stars) ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      >
                        <polygon points="12 2 15 9 22 9.3 16.5 14 18.3 21 12 17.3 5.7 21 7.5 14 2 9.3 9 9" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep("comment")}
                disabled={stars === 0}
                style={{ ...btnPrimary, opacity: stars === 0 ? 0.4 : 1 }}
              >
                Continuer
              </button>
            </div>
          )}

          {step === "comment" && wineData && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 8 }}>
              <WineRecap wine={wineData} stars={stars} />

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Notes de dégustation, impressions... (optionnel)"
                rows={4}
                style={{
                  ...inputStyle,
                  resize: "none",
                  fontFamily: "var(--font-display)",
                  fontStyle: comment ? "italic" : "normal",
                  fontSize: 15,
                  lineHeight: 1.4,
                }}
              />

              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{ ...btnPrimary, opacity: isSaving ? 0.6 : 1 }}
              >
                {isSaving ? (
                  <>
                    <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                    Sauvegarde...
                  </>
                ) : (
                  "Sauvegarder la dégustation"
                )}
              </button>
            </div>
          )}
        </div>

        {/* ScanLabelSheet INSIDE SheetContent — fix PR #96 */}
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
      </SheetContent>
    </Sheet>
  )
}
