"use client"

import { useState, useRef, useCallback } from "react"
import { Camera, ImagePlus, Loader2, X, Check, AlertCircle } from "lucide-react"
import type { Wine as WineType } from "@/data/apogee"
import type { ScanLabelResult } from "@/app/api/scan-label/route"

interface ScanLabelSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (wine: WineType) => void
  onPaywallRequired?: () => void
}

type ScanStep = "capture" | "scanning" | "result" | "error"

/* ── Animated Viewfinder Component ─────────────────────────────── */
function ScanViewfinder() {
  return (
    <div className="relative mx-auto flex h-64 w-56 items-center justify-center">
      {/* Animated corner marks */}
      <div className="absolute inset-0">
        {/* Top-left corner */}
        <div className="absolute left-0 top-0 h-8 w-8">
          <div className="absolute left-0 top-0 h-full w-0.5 animate-pulse bg-gradient-to-b from-gold to-transparent" />
          <div className="absolute left-0 top-0 h-0.5 w-full animate-pulse bg-gradient-to-r from-gold to-transparent" />
        </div>
        {/* Top-right corner */}
        <div className="absolute right-0 top-0 h-8 w-8">
          <div className="absolute right-0 top-0 h-full w-0.5 animate-pulse bg-gradient-to-b from-gold to-transparent" />
          <div className="absolute right-0 top-0 h-0.5 w-full animate-pulse bg-gradient-to-l from-gold to-transparent" />
        </div>
        {/* Bottom-left corner */}
        <div className="absolute bottom-0 left-0 h-8 w-8">
          <div className="absolute bottom-0 left-0 h-full w-0.5 animate-pulse bg-gradient-to-t from-gold to-transparent" />
          <div className="absolute bottom-0 left-0 h-0.5 w-full animate-pulse bg-gradient-to-r from-gold to-transparent" />
        </div>
        {/* Bottom-right corner */}
        <div className="absolute bottom-0 right-0 h-8 w-8">
          <div className="absolute bottom-0 right-0 h-full w-0.5 animate-pulse bg-gradient-to-t from-gold to-transparent" />
          <div className="absolute bottom-0 right-0 h-0.5 w-full animate-pulse bg-gradient-to-l from-gold to-transparent" />
        </div>
      </div>

      {/* Inner frame with subtle border */}
      <div className="absolute inset-4 rounded-lg border border-rouge/30 bg-rouge/5" />

      {/* Wine bottle silhouette */}
      <div className="relative flex flex-col items-center gap-3">
        {/* Stylized wine bottle */}
        <svg
          width="48"
          height="100"
          viewBox="0 0 48 100"
          fill="none"
          className="opacity-40"
        >
          {/* Bottle neck */}
          <rect x="19" y="0" width="10" height="20" rx="2" fill="#722F37" />
          {/* Cork area */}
          <rect x="17" y="18" width="14" height="8" rx="1" fill="#722F37" />
          {/* Bottle shoulder */}
          <path
            d="M17 26 C17 26 10 35 10 45 L10 95 C10 97.5 12 100 14.5 100 L33.5 100 C36 100 38 97.5 38 95 L38 45 C38 35 31 26 31 26 Z"
            fill="#722F37"
          />
          {/* Label area */}
          <rect x="14" y="55" width="20" height="28" rx="2" fill="#C0956C" fillOpacity="0.3" />
          {/* Label lines */}
          <rect x="17" y="62" width="14" height="1.5" rx="0.75" fill="#C0956C" fillOpacity="0.5" />
          <rect x="17" y="67" width="10" height="1" rx="0.5" fill="#C0956C" fillOpacity="0.4" />
          <rect x="17" y="72" width="12" height="1" rx="0.5" fill="#C0956C" fillOpacity="0.4" />
        </svg>

        {/* Scan line animation */}
        <div className="absolute inset-x-4 top-8 h-0.5 animate-[scan_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      </div>
    </div>
  )
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Chargement de l image impossible"))
    img.src = src
  })
}

// Redimensionne l image cote client (canvas) pour rester sous la limite de corps Vercel
// et eviter les payloads enormes des photos Android. Renvoie un JPEG base64.
async function downscaleImage(
  file: File,
  maxDim = 1600,
  quality = 0.8
): Promise<{ base64: string; mediaType: string; previewUrl: string }> {
  const dataUrl = await readFileAsDataUrl(file)
  const img = await loadImage(dataUrl)
  let width = img.naturalWidth || img.width
  let height = img.naturalHeight || img.height
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    const fallback = dataUrl.split(",")[1] ?? ""
    return { base64: fallback, mediaType: file.type || "image/jpeg", previewUrl: dataUrl }
  }
  ctx.drawImage(img, 0, 0, width, height)
  const outUrl = canvas.toDataURL("image/jpeg", quality)
  const base64 = outUrl.split(",")[1] ?? ""
  return { base64, mediaType: "image/jpeg", previewUrl: outUrl }
}

export function ScanLabelSheet({ isOpen, onOpenChange, onAdd, onPaywallRequired }: ScanLabelSheetProps) {
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
    setStep("scanning")
    setPreview(null)

    try {
      const { base64, mediaType, previewUrl } = await downscaleImage(file)
      setPreview(previewUrl)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      const res = await fetch("/api/scan-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      if (!res.ok) {
        if (res.status === 403) {
          onOpenChange(false)
          onPaywallRequired?.()
          return
        }
        if (res.status === 503) {
          setErrorMsg("La cle API n'est pas encore configuree. Contactez l'administrateur.")
        } else {
          const err = await res.json().catch(() => null)
          setErrorMsg((err && err.error) || "Erreur lors de l'analyse")
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
    } catch (err: unknown) {
      const aborted = err instanceof DOMException && err.name === "AbortError"
      setErrorMsg(
        aborted
          ? "Analyse trop longue. Verifiez votre connexion et reessayez."
          : "Impossible d'analyser l'image. Reessayez."
      )
      setStep("error")
    }
  }, [onOpenChange, onPaywallRequired])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processImage(file)
  }

  const handleConfirm = () => {
    const wine: WineType = {
      wine_name: [domaine, wineName].filter(Boolean).join(" — ") || "Vin sans nom",
      wine_appellation: appellation || undefined,
      wine_region: region || undefined,
      millesime_year: millesime ? parseInt(millesime) : undefined,
      bottle_quantity: 1,
      wine_color: undefined,
      wine_type: undefined,
      wine_classification: undefined,
      _manual: true,
    } as WineType
    onAdd(wine)
    handleClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 flex min-h-[65dvh] flex-col rounded-t-2xl border-t border-rouge/30 bg-background">
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-neutral-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-xl font-semibold text-white">
              Scanner une etiquette
            </h2>
            <span className="inline-flex items-center rounded-full bg-rouge px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">
              Bientôt
            </span>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5 text-neutral-400" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-8">
          {/* STEP: capture */}
          {step === "capture" && (
            <div className="flex flex-1 flex-col">
              {/* Viewfinder Zone */}
              <div className="flex-1 py-4">
                <ScanViewfinder />
              </div>

              {/* Subtitle */}
              <p className="mb-6 text-center text-sm text-neutral-400">
                Cadrez l'etiquette dans la zone pour une meilleure reconnaissance
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {/* Primary Button */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-3 rounded-xl bg-rouge py-4 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  <Camera className="h-5 w-5" />
                  Prendre une photo
                </button>

                {/* Secondary Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-3 rounded-xl border border-rouge py-4 text-sm font-medium text-neutral-300 transition-all hover:bg-white/5 active:scale-[0.98]"
                >
                  <ImagePlus className="h-5 w-5" />
                  Choisir depuis la galerie
                </button>
              </div>

              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {/* STEP: scanning */}
          {step === "scanning" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8">
              {preview && (
                <img
                  src={preview}
                  alt="Etiquette"
                  className="h-48 w-auto rounded-xl object-contain border border-rouge"
                />
              )}
              <div className="flex items-center gap-3 text-sm text-neutral-400">
                <Loader2 className="h-5 w-5 animate-spin text-gold" />
                Analyse en cours...
              </div>
            </div>
          )}

          {/* STEP: error */}
          {step === "error" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 py-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <p className="max-w-xs text-center text-sm text-neutral-400">{errorMsg}</p>
              <button
                onClick={reset}
                className="rounded-xl border border-rouge px-8 py-3 text-sm font-medium text-white transition-all hover:bg-white/5"
              >
                Reessayer
              </button>
            </div>
          )}

          {/* STEP: result */}
          {step === "result" && (
            <div className="flex flex-col gap-5">
              {preview && (
                <img
                  src={preview}
                  alt="Etiquette"
                  className="mx-auto h-36 w-auto rounded-xl object-contain border border-rouge"
                />
              )}

              {result?.confidence === "low" && (
                <div className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3">
                  <AlertCircle className="h-4 w-4 shrink-0 text-gold" />
                  <p className="text-xs text-gold">
                    Lecture partielle — verifiez les informations.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {[
                  { label: "Domaine", value: domaine, setter: setDomaine },
                  { label: "Nom du vin", value: wineName, setter: setWineName },
                  { label: "Millesime", value: millesime, setter: setMillesime, type: "number" },
                  { label: "Region", value: region, setter: setRegion },
                  { label: "Appellation", value: appellation, setter: setAppellation },
                ].map(({ label, value, setter, type }) => (
                  <div key={label}>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                      {label}
                    </label>
                    <input
                      type={type || "text"}
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="w-full rounded-lg border border-ink bg-card px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={reset}
                  className="flex-1 rounded-xl border border-rouge py-3.5 text-sm font-medium text-white transition-all hover:bg-white/5"
                >
                  Rescanner
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rouge py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90"
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
