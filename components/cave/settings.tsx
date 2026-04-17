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
      if (data.length > 0) {
        onImport(data)
      }
    },
    [parseFile, onImport]
  )

  const handleReset = useCallback(async () => {
    if (!user) return
    setIsResetting(true)
    setResetError(null)

    try {
      // 1. Supprimer les données cloud via API serveur (service role — contourne RLS)
      const res = await fetch("/api/reset-user", { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Erreur serveur (${res.status})`)
      }

      // 2. Effacer toutes les clés localStorage métier (inclut cave-offline-cache)
      clearAllLocalCaveData()
      localStorage.removeItem(MIGRATION_DONE_KEY)

      // 3. Réinitialiser l'état mémoire React de chaque hook
      clearAllStockOverrides()
      resetTastings()
      resetEnrichments()
      resetActiveCave()

      // 4. Reload — état propre garanti
      window.location.reload()
    } catch (err) {
      console.error("[settings] Reset failed:", err)
      const message = err instanceof Error ? err.message : "La suppression a échoué."
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
      // ignore, on force le redirect de toute façon
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
      <section className="mx-4 mt-3 rounded-xl border border-cave-border bg-card p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Statut de la cave</p>
              <p className="text-xs text-muted-foreground">
                {totalBottles} bouteille{totalBottles !== 1 ? "s" : ""} en stock
              </p>
            </div>
          </div>
          {cave.length > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-950/40 px-2 py-0.5 text-xs text-emerald-400 ring-1 ring-emerald-800/40">
              <CheckCircle className="h-3 w-3" />
              Actif
            </span>
          )}
        </div>
        {formattedDate && (
          <p className="mt-3 text-xs text-muted-foreground">
            Derniere mise a jour : {formattedDate}
          </p>
        )}
      </section>

      {/* Import Section */}
      <section className="mx-4 mt-4">
        <h2 className="mb-3 font-serif text-base font-medium text-foreground">
          Mettre a jour la cave
        </h2>
        <ImportZone onFileSelected={handleFile} isParsing={isParsing} compact />
        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}
      </section>

      {/* Prochainement */}
      {getComingSoonFeatures().length > 0 && (
        <section className="mx-4 mt-6">
          <h2 className="mb-3 font-serif text-base font-medium text-foreground">
            Prochainement
          </h2>
          <div className="flex flex-col gap-2">
            {getComingSoonFeatures().map((feature) => {
              const Icon = feature.icon ? ICON_MAP[feature.icon] : null
              return (
                <div
                  key={feature.key}
                  className="flex items-start gap-3 rounded-xl border border-cave-border bg-card px-4 py-3"
                >
                  {Icon && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{feature.label}</p>
                      <ComingSoonBadge />
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
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
        <h2 className="mb-3 font-serif text-base font-medium text-foreground">
          Compte
        </h2>
        {user ? (
          <div className="flex flex-col gap-3 rounded-xl border border-cave-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">{user.email}</p>
              <Badge
                variant="outline"
                className="border-emerald-800/40 bg-emerald-950/40 text-emerald-400"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Cave synchronisée
              </Badge>
            </div>
            <button
              onClick={() => setCaveManagerOpen(true)}
              className="flex w-full items-center justify-between rounded-lg border border-cave-border bg-background/50 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/50"
            >
              <span>Mes caves</span>
              <span className="text-muted-foreground">({caves.length})</span>
            </button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? "Deconnexion..." : "Se déconnecter"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl border border-cave-border bg-card p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Synchronisez votre cave</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Accédez à votre cave sur tous vos appareils
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setAuthOpen(true)}
            >
              Se connecter / Créer un compte
            </Button>
          </div>
        )}
        <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
        <CaveManagerSheet open={caveManagerOpen} onOpenChange={setCaveManagerOpen} />
      </section>

      {/* Zone de danger */}
      {cave.length > 0 && (
        <section className="mx-4 mt-6">
          <h2 className="mb-3 font-serif text-base font-medium text-foreground">
            Zone de danger
          </h2>
          <button
            onClick={() => setConfirmStep(1)}
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive transition-colors hover:bg-destructive/20"
          >
            <Trash2 className="h-4 w-4" />
            Réinitialiser ma cave
          </button>
        </section>
      )}

      {/* Étape 1 — Première confirmation */}
      <AlertDialog
        open={confirmStep === 1}
        onOpenChange={(open) => { if (!open) setConfirmStep(0) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser ma cave</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Elle supprimera définitivement :
            </AlertDialogDescription>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Tous vos vins</li>
              <li>• Toutes vos caves</li>
              <li>• Votre historique de dégustations</li>
              <li>• Vos données de stock</li>
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

      {/* Étape 2 — Dernière confirmation + exécution */}
      <AlertDialog
        open={confirmStep === 2}
        onOpenChange={(open) => { if (!open && !isResetting) setConfirmStep(0) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dernière confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous certain ? Toutes vos données seront perdues définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {resetError && (
            <p className="text-sm text-destructive">{resetError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isResetting}
              onClick={() => setConfirmStep(0)}
            >
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

      {/* À propos */}
      <section className="mx-4 mt-6">
        <h2 className="mb-3 font-serif text-base font-medium text-foreground">
          À propos
        </h2>
        <Link
          href="/confidentialite"
          className="flex items-center gap-3 rounded-xl border border-cave-border bg-card px-4 py-3 transition-colors hover:border-primary/30"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">
            Politique de confidentialité
          </span>
        </Link>
      </section>
    </div>
  )
}
