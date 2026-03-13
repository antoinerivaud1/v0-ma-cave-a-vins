"use client"

import { useState, useCallback } from "react"
import { Wine, ArrowRight } from "lucide-react"
import { ImportZone } from "./import-zone"
import { useFileParser } from "@/hooks/use-file-parser"
import { useUserProfile } from "@/hooks/use-user-profile"
import type { Wine as WineType } from "@/data/apogee"

interface OnboardingProps {
  onImport: (data: WineType[]) => void
  onAddManual?: (wine: WineType) => void
}

type Step = "name" | "cave"

export function Onboarding({ onImport, onAddManual }: OnboardingProps) {
  const { parseFile, isParsing, error } = useFileParser()
  const { saveProfile } = useUserProfile()
  const [step, setStep] = useState<Step>("name")
  const [firstName, setFirstName] = useState("")

  const handleNameSubmit = () => {
    const name = firstName.trim()
    if (!name) return
    saveProfile({ firstName: name })
    setStep("cave")
  }

  const handleFile = useCallback(
    async (file: File) => {
      const data = await parseFile(file)
      if (data.length > 0) {
        onImport(data)
      }
    },
    [parseFile, onImport]
  )

  const handleSkip = () => {
    if (onAddManual) {
      onImport([])
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Wine className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Ma Cave a Vins</h1>
        </div>

        {step === "name" && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <h2 className="font-serif text-xl font-semibold text-foreground">Comment vous appelez-vous ?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Pour personnaliser votre experience.</p>
            </div>

            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              placeholder="Votre prenom"
              autoFocus
              className="w-full rounded-xl border border-cave-border bg-card px-4 py-3.5 text-center font-serif text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <button
              onClick={handleNameSubmit}
              disabled={!firstName.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
            >
              Continuer
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === "cave" && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <h2 className="font-serif text-xl font-semibold text-foreground">
                Bienvenue {firstName} !
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Importez votre cave ou commencez a ajouter des bouteilles.
              </p>
            </div>

            <ImportZone onFileSelected={handleFile} isParsing={isParsing} />

            {error && (
              <p className="rounded-lg bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-cave-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="h-px flex-1 bg-cave-border" />
            </div>

            <button
              onClick={handleSkip}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-cave-border bg-card py-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary/30"
            >
              Commencer avec une cave vide
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Compatible avec les exports Vivino, CellarTracker et tout fichier Excel structure.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
