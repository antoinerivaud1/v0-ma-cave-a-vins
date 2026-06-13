"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { Database, Trash2, CheckCircle, Camera, Globe, Layers, ShieldCheck, type LucideIcon } from "lucide-react"
import { PageHeader } from "./page-header"
import { ImportZone } from "./import-zone"
import { ComingSoonBadge } from "./coming-soon-badge"
import { getComingSoonFeatures } from "@/lib/feature-flags"
import { useFileParser } from "@/hooks/use-file-parser"
import type { Wine } from "@/data/apogee"
import { useAuth } from "@/hooks/use-auth"
import { AuthSheet } from "@/components/cave/auth-sheet"
import { CaveManagerSheet } from "@/components/cave/cave-manager-sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { useCaves } from "@/hooks/use-caves"
import { clearAllStockOverrides, useStockOverrides } from "@/hooks/use-stock-overrides"
import { getEffectiveWineState } from "@/lib/stock-overrides"
import { clearAllLocalCaveData, MIGRATION_DONE_KEY } from "@/lib/cave-storage"
import { useTastings } from "@/hooks/use-tastings"
import { useWineEnrichmentLegacy } from "@/hooks/use-wine-enrichment"

const ICON_MAP: Record<string, LucideIcon> = { Camera, Globe, Layers }

interface SettingsProps {
  cave: Wine[]
  lastUpdated: string | null
  onImport: (data: Wine[]) => void
  onClear: () => void | Promise<void>
}

const sectionCard = "rounded-xl border-2 border-ink bg-paper-2 p-4"
const sectionCardStyle = { boxShadow: "2px 2px 0 var(--shadow-hard)" }

export function Settings({ cave, lastUpdated, onImport }: SettingsProps) {
  const { parseFile, isParsing, error } = useFileParser()
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0)
  const [isResetting, setIsResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [caveManagerOpen, setCaveManagerOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { caves, resetActiveCave } = useCaves()
  const { getOverrideForWine } = useStockOverrides()
  const { resetTastings } = useTastings()
  const { resetEnrichments } = useWineEnrichmentLegacy()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const totalBottles = cave.reduce((s, w) => {
    const effectiveState = getEffectiveWineState(w, getOverrideForWine(w))
    if (!effectiveState.isVisible) return s
    return s + effectiveState.quantity
  }, 0)

  const handleFile = useCallback(
    async (file: File) => {
      const data = await parseFile(file)
      if (data.length > 0) onImport(data)
    },
    [parseFile, onImport]
  )

  const handleReset = useCallback(async () => {
    if (!user) return
    setIsResetting(true)
    setResetError(null)
    try {
      const res = await fetch("/api/reset-user", { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Erreur serveur (${res.status})`)
      }
      clearAllLocalCaveData()
      localStorage.removeItem(MIGRATION_DONE_KEY)
      clearAllStockOverrides()
      resetTastings()
      resetEnrichments()
      resetActiveCave()
      window.location.reload()
    } catch (err) {
      console.error("[settings] Reset failed:", err)
      const message = err instanceof Error ? err.message : "La suppression a echoue."
      setResetError(message)
    } finally {
      setIsResetting(false)
    }
  }, [user, resetTastings, resetEnrichments, resetActiveCave])

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } catch {
      // ignore
    }
    window.location.href = "/"
  }, [signOut])

  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  return (
    <div className="pb-4">
      <PageHeader title="Reglages" />

      {/* Cave Status */}
      <section className="mx-4 mt-3">
        <div className={sectionCard} style={sectionCardStyle}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink"
                style={{ background: "var(--rouge)", color: "var(--rouge-fg)" }}
              >
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Statut de la cave</p>
                <p className="text-xs text-ink-soft">
                  {totalBottles} bouteille{totalBottles !== 1 ? "s" : ""} en stock
                </p>
              </div>
            </div>
            {cave.length > 0 && (
              <span className="flex items-center gap-1 rounded-full border border-ink px-2 py-0.5 text-xs text-ink">
                <CheckCircle className="h-3 w-3" />
                Actif
              </span>
            )}
          </div>
          {formattedDate && (
            <p className="mt-3 text-xs text-ink-soft border-t border-ink/20 pt-2">
              Derniere mise a jour : {formattedDate}
            </p>
          )}
        </div>
      </section>

      {/* Import Section */}
      <section className="mx-4 mt-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-ink-soft">
          Mettre a jour la cave
        </p>
        <ImportZone onFileSelected={handleFile} isParsing={isParsing} compact />
        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}
      </section>

      {/* Prochainement */}
      {getComingSoonFeatures().length > 0 && (
        <section className="mx-4 mt-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-ink-soft">
            Prochainement
          </p>
          <div className="flex flex-col gap-2">
            {getComingSoonFeatures().map((feature) => {
              const Icon = feature.icon ? ICON_MAP[feature.icon] : null
              return (
                <div
                  key={feature.key}
                  className="flex items-start gap-3 rounded-xl border-2 border-ink bg-paper-2 px-4 py-3"
                  style={{ boxShadow: "2px 2px 0 var(--shadow-hard)" }}
                >
                  {Icon && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink bg-[var(--bg)]">
                      <Icon className="h-4 w-4 text-ink-soft" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{feature.label}</p>
                      <ComingSoonBadge />
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Compte */}
      <section className="mx-4 mt-6">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-ink-soft">
          Compte
        </p>
        {user ? (
          <div className={sectionCard} style={sectionCardStyle}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-ink">{user.email}</p>
              <Badge
                variant="outline"
                className="border-ink text-ink"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Cave synchronisee
              </Badge>
            </div>
            <button
              onClick={() => setCaveManagerOpen(true)}
              className="flex w-full items-center justify-between rounded-lg border border-ink bg-[var(--bg)] px-3 py-2.5 text-sm text-ink transition-colors hover:bg-paper-2 mb-2"
            >
              <span>Mes caves</span>
              <span className="text-ink-soft">({caves.length})</span>
            </button>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-ink text-ink hover:bg-paper-2"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? "Deconnexion..." : "Se deconnecter"}
            </Button>
          </div>
        ) : (
          <div className={sectionCard} style={sectionCardStyle}>
            <p className="text-sm font-semibold text-ink">Synchronisez votre cave</p>
            <p className="mt-0.5 mb-3 text-xs text-ink-soft">
              Acces a votre cave sur tous vos appareils
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-ink text-ink hover:bg-paper-2"
              onClick={() => setAuthOpen(true)}
            >
              Se connecter / Creer un compte
            </Button>
          </div>
        )}
        <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
        <CaveManagerSheet open={caveManagerOpen} onOpenChange={setCaveManagerOpen} />
      </section>

      {/* Zone de danger */}
      {cave.length > 0 && (
        <section className="mx-4 mt-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-ink-soft">
            Zone de danger
          </p>
          <button
            onClick={() => setConfirmStep(1)}
            className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive transition-colors hover:bg-destructive/20"
          >
            <Trash2 className="h-4 w-4" />
            Reinitialiser ma cave
          </button>
        </section>
      )}

      {/* Confirmation step 1 */}
      <AlertDialog
        open={confirmStep === 1}
        onOpenChange={(open) => { if (!open) setConfirmStep(0) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reinitialiser ma cave</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible. Elle supprimera definitivement :
            </AlertDialogDescription>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Tous vos vins</li>
              <li>• Toutes vos caves</li>
              <li>• Votre historique de degustations</li>
              <li>• Vos donnees de stock</li>
            </ul>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmStep(0)}>
              Annuler
            </AlertDialogCancel>
            <button
              onClick={() => { setResetError(null); setConfirmStep(2) }}
              className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-destructive/80"
            >
              Je comprends, continuer
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation step 2 */}
      <AlertDialog
        open={confirmStep === 2}
        onOpenChange={(open) => { if (!open && !isResetting) setConfirmStep(0) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Derniere confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Etes-vous certain ? Toutes vos donnees seront perdues definitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {resetError && (
            <p className="text-sm text-destructive">{resetError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting} onClick={() => setConfirmStep(0)}>
              Annuler
            </AlertDialogCancel>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {isResetting ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Suppression en cours...
                </>
              ) : (
                "Supprimer tout"
              )}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* A propos */}
      <section className="mx-4 mt-6">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-ink-soft">
          A propos
        </p>
        <Link
          href="/confidentialite"
          className="flex items-center gap-3 rounded-xl border-2 border-ink bg-paper-2 px-4 py-3 transition-colors hover:bg-[var(--bg)]"
          style={{ boxShadow: "2px 2px 0 var(--shadow-hard)" }}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink bg-[var(--bg)]">
            <ShieldCheck className="h-4 w-4 text-ink-soft" />
          </div>
          <span className="text-sm font-medium text-ink">
            Politique de confidentialite
          </span>
        </Link>
      </section>
    </div>
  )
}
