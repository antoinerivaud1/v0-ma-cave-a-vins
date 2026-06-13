"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { REGIONS } from "@/data/regions"
import { useWineEnrichmentLegacy } from "@/hooks/use-wine-enrichment"
import type { Wine } from "@/data/apogee"

interface AddWineSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (wine: Wine) => void
}

const WINE_TYPES = [
  { key: "wine_red", label: "Rouge", emoji: "🍷" },
  { key: "wine_white", label: "Blanc", emoji: "🥂" },
  { key: "wine_white_sparkling", label: "Pétillant", emoji: "✨" },
]

const CURRENT_YEAR = new Date().getFullYear()

export function AddWineSheet({ isOpen, onOpenChange, onAdd }: AddWineSheetProps) {
  const { enrichWine } = useWineEnrichmentLegacy()
  const [name, setName] = useState("")
  const [type, setType] = useState("wine_red")
  const [millesime, setMillesime] = useState(String(CURRENT_YEAR - 3))
  const [region, setRegion] = useState("bordeaux")
  const [domain, setDomain] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setName("")
    setType("wine_red")
    setMillesime(String(CURRENT_YEAR - 3))
    setRegion("bordeaux")
    setDomain("")
    setQuantity("1")
    setError(null)
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Le nom du vin est obligatoire.")
      return
    }
    const year = parseInt(millesime)
    if (!year || year < 1900 || year > CURRENT_YEAR) {
      setError("Millésime invalide.")
      return
    }

    const wine: Wine = {
      wine_name: name.trim(),
      wine_type: type,
      wine_region: region,
      millesime_year: year,
      bottle_quantity: Math.max(1, parseInt(quantity) || 1),
      wine_domain: domain.trim() || undefined,
      _manual: true,
    }

    onAdd(wine)
    void enrichWine(wine)
    reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) reset(); onOpenChange(open) }}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90dvh] flex flex-col">
        <SheetHeader
          className="mb-5"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
        >
          <SheetTitle className="font-serif text-xl text-center">Ajouter un vin</SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto flex-1 flex flex-col gap-4 pb-8">

          {/* Nom */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Nom du vin <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null) }}
              placeholder="ex. Château Margaux, Meursault..."
              className="w-full rounded-lg border border-ink bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Type <span className="text-primary">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {WINE_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={`flex flex-col items-center gap-1 rounded-lg border py-3 text-sm font-medium transition-colors ${
                    type === t.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-ink bg-card text-muted-foreground"
                  }`}
                >
                  <span className="text-xl">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Millésime + Quantité */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Millésime <span className="text-primary">*</span>
              </label>
              <input
                type="number"
                value={millesime}
                onChange={(e) => { setMillesime(e.target.value); setError(null) }}
                min={1900}
                max={CURRENT_YEAR}
                className="w-full rounded-lg border border-ink bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Quantité
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min={1}
                max={999}
                className="w-full rounded-lg border border-ink bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Région */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Région <span className="text-primary">*</span>
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-lg border border-ink bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {Object.entries(REGIONS).map(([key, r]) => (
                <option key={key} value={key}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Domaine */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Domaine <span className="text-muted-foreground/50">(optionnel)</span>
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="ex. Domaine de la Romanée-Conti"
              className="w-full rounded-lg border border-ink bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Ajouter à ma cave
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
