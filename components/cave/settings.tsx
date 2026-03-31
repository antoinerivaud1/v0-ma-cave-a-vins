'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { Database, Trash2, CheckCircle, Camera, Globe, Layers, ShieldCheck, type LucideIcon } from 'lucide-react'
import { PageHeader } from './page-header'
import { ImportZone } from './import-zone'
import { ComingSoonBadge } from "./coming-soon-badge"
import { getComingSoonFeatures } from "@/lib/feature-flags"
import { useFileParser } from '@/hooks/use-file-parser'
import type { Wine } from '@/data/apogee'
import { useAuth } from "@/hooks/use-auth"
import { AuthSheet } from "@/components/cave/auth-sheet"
import { CaveManagerSheet } from "@/components/cave/cave-manager-sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCaves } from "@/hooks/use-caves"
import { useStockOverrides } from "@/hooks/use-stock-overrides"
import { getEffectiveWineState } from "@/lib/stock-overrides"

const ICON_MAP: Record<string, LucideIcon> = { Camera, Globe, Layers }

interface SettingsProps {
  cave: Wine[]
  lastUpdated: string | null
  onImport: (data: Wine[]) => void
  onClear: () => void
}

export function Settings({ cave, lastUpdated, onImport, onClear }: SettingsProps) {
  const { parseFile, isParsing, error } = useFileParser()
  const [showConfirm, setShowConfirm] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [caveManagerOpen, setCaveManagerOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { caves } = useCaves()
  const { getOverrideForWine } = useStockOverrides()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

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

  const handleReset = useCallback(() => {
    onClear()
    setShowConfirm(false)
  }, [onClear])

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true)
    setSignOutError(null)
    try {
      await signOut()
    } catch {
      // ignore, on force le reload de toute façon
    }
    window.location.href = "/"
  }, [signOut])

  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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
                {totalBottles} bouteille{totalBottles !== 1 ? 's' : ''} en stock
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

      {/* Reset Section */}
      {cave.length > 0 && (
        <section className="mx-4 mt-6">
          <h2 className="mb-3 font-serif text-base font-medium text-foreground">
            Zone de danger
          </h2>
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive transition-colors hover:bg-destructive/20"
            >
              <Trash2 className="h-4 w-4" />
              Reinitialiser la cave
            </button>
          ) : (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm text-foreground">
                Etes-vous sur ? Cette action supprimera toutes les donnees de votre cave.
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={handleReset}
                  className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-destructive/80"
                >
                  Confirmer
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="rounded-lg border border-cave-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </section>
      )}
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
