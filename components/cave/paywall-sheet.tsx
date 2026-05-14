"use client"

import { Camera, Lock } from "lucide-react"
import { toast } from "sonner"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface PaywallSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  featureName: string
  featureDescription: string
  planRequired: "amateur" | "collector"
  planPrice: string
  onManualAdd?: () => void
}

export function PaywallSheet({
  isOpen,
  onOpenChange,
  featureName,
  featureDescription,
  planRequired,
  planPrice,
  onManualAdd,
}: PaywallSheetProps) {
  const planLabel = planRequired === "amateur" ? "Amateur" : "Collectionneur"

  const handleUpgrade = () => {
    toast("Bientôt disponible — les abonnements arrivent très prochainement !")
    onOpenChange(false)
  }

  const handleManualAdd = () => {
    onOpenChange(false)
    onManualAdd?.()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-0 pb-0 max-h-[90dvh] z-[60] flex flex-col"
      >
        <div
          className="flex flex-col items-center gap-6 px-6 pt-8 pb-6 overflow-y-auto flex-1"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          {/* Icône feature */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cave-bordeaux/10">
            <Camera className="h-9 w-9 text-cave-bordeaux" />
          </div>

          {/* Texte */}
          <div className="text-center">
            <h2 className="font-cormorant text-2xl font-normal text-foreground">
              {featureName}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {featureDescription}
            </p>
          </div>

          {/* Badge plan */}
          <div className="flex items-center gap-2 rounded-xl border border-cave-bordeaux/20 bg-cave-bordeaux/5 px-4 py-3">
            <Lock className="h-4 w-4 shrink-0 text-cave-bordeaux" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Plan {planLabel}
              </p>
              <p className="text-xs text-muted-foreground">
                À partir de {planPrice}
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex w-full flex-col gap-3">
            <button
              onClick={handleUpgrade}
              className="w-full rounded-xl bg-cave-bordeaux py-3.5 text-sm font-medium text-white"
            >
              Passer à {planLabel}
            </button>
            {onManualAdd && (
              <button
                onClick={handleManualAdd}
                className="w-full rounded-xl border border-cave-border py-3.5 text-sm font-medium text-foreground"
              >
                Ajouter manuellement
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
