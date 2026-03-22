"use client"

import { useState, useRef, useCallback } from "react"
import { Camera, ImagePlus, Loader2, X, Check, AlertCircle } from "lucide-react"
import { ComingSoonBadge } from "./coming-soon-badge"
import type { Wine } from "@/data/apogee"
import type { ScanLabelResult } from "@/app/api/scan-label/route"

interface ScanLabelSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (wine: Wine) => void
}

type ScanStep = "capture" | "scanning" | "result" | "error"

export function ScanLabelSheet({ isOpen, onOpenChange, onAdd }: ScanLabelSheetProps) {
  const [step, setStep] = useState<ScanStep>("capture")
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<ScanLabelResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Champs editables apres scan
  const [wineName, setWineName] = useState("")
  const [domaine, setDomaine] = useState("")
  const [millesime, setMillesime] = useState("")
  const [region, setRegion] = useState("")
  const [appellation, setAppellation] = useState("")

  const reset = useCallback(() => {
    setStep("capture")
    setPreview(null)
    setResult(null)
    setErrorMsg(null)
    setWineName("")
    setDomaine("")
    setMillesime("")
    setRegion("")
    setAppellation("")
  }, [])

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  const processImage = useCallback(async (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      setStep("scanning")

      try {
        const base64 = dataUrl.split(",")[1]
        const mediaType = file.type || "image/jpeg"

        const res = await fetch("/api/scan-label", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mediaType }),
        })

        if (!res.ok) {
          const err = await res.json()
          if (res.status === 503) {
            setErrorMsg("La cle API n'est pas encore configuree. Contactez l'administrateur.")
          } else {
            setErrorMsg(err.error || "Erreur lors de l'analyse")
          }
          setStep("error")
          return
        }

        const data: ScanLabelResult = await res.json()
        setResult(data)
        setWineName(data.wineName || data.domaine || "")
        setDomaine(data.domaine || "")
        setMillesime(data.millesime ? String(data.millesime) : "")
        setRegion(data.region || "")
        setAppellation(data.appellation || "")
        setStep("result")
      } catch (err: any) {
        setErrorMsg("Impossible d'analyser l'image. Reessayez.")
        setStep("error")
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processImage(file)
  }

  const handleConfirm = () => {
    const wine: Wine = {
      wine_name: [domaine, wineName].filter(Boolean).join(" — ") || "Vin sans nom",
      wine_appellation: appellation || undefined,
      wine_region: region || undefined,
      millesime_year: millesime ? parseInt(millesime) : undefined,
      bottle_quantity: 1,
      wine_color: undefined,
      wine_type: undefined,
      wine_classification: undefined,
      _manual: true,
    } as any
    onAdd(wine)
    handleClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-background border-t border-cave-border max-h-[90dvh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-cave-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg font-semibold text-foreground">Scanner une etiquette</h2>
            <ComingSoonBadge />
          </div>
          <button onClick={handleClose} className="rounded-full p-1.5 hover:bg-secondary">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-4 pb-6 overflow-y-auto flex-1">

          {/* STEP: capture */}
          {step === "capture" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground text-center pb-1">
                Prenez en photo l'etiquette de votre bouteille.
              </p>
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-3 rounded-xl border border-cave-border bg-card px-4 py-4 transition-colors hover:border-primary/30"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
                  <Camera className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Prendre une photo</p>
                  <p className="text-xs text-muted-foreground">Ouvrir l'appareil photo</p>
                </div>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 rounded-xl border border-cave-border bg-card px-4 py-4 transition-colors hover:border-primary/30"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                  <ImagePlus className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Choisir une photo</p>
                  <p className="text-xs text-muted-foreground">Depuis la galerie</p>
                </div>
              </button>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {/* STEP: scanning */}
          {step === "scanning" && (
            <div className="flex flex-col items-center gap-4 py-6">
              {preview && (
                <img src={preview} alt="Etiquette" className="h-40 w-auto rounded-lg object-contain border border-cave-border" />
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Analyse en cours...
              </div>
            </div>
          )}

          {/* STEP: error */}
          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-center text-sm text-muted-foreground">{errorMsg}</p>
              <button
                onClick={reset}
                className="rounded-xl border border-cave-border bg-card px-6 py-2.5 text-sm font-medium text-foreground"
              >
                Reessayer
              </button>
            </div>
          )}

          {/* STEP: result */}
          {step === "result" && (
            <div className="flex flex-col gap-4">
              {preview && (
                <img src={preview} alt="Etiquette" className="h-32 w-auto rounded-lg object-contain border border-cave-border mx-auto" />
              )}

              {result?.confidence === "low" && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-950/30 border border-amber-800/30 px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-400">Lecture partielle — verifiez les informations.</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {[
                  { label: "Domaine", value: domaine, setter: setDomaine },
                  { label: "Nom du vin", value: wineName, setter: setWineName },
                  { label: "Millesime", value: millesime, setter: setMillesime, type: "number" },
                  { label: "Region", value: region, setter: setRegion },
                  { label: "Appellation", value: appellation, setter: setAppellation },
                ].map(({ label, value, setter, type }) => (
                  <div key={label}>
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</label>
                    <input
                      type={type || "text"}
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-cave-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={reset}
                  className="flex-1 rounded-xl border border-cave-border bg-card py-3 text-sm font-medium text-foreground"
                >
                  Rescanner
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
                >
                  <Check className="h-4 w-4" />
                  Ajouter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
