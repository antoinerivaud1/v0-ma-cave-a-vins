'use client'

import { useCallback } from 'react'
import { Wine } from 'lucide-react'
import { ImportZone } from './import-zone'
import { useFileParser } from '@/hooks/use-file-parser'
import type { Wine as WineType } from '@/data/apogee'

interface OnboardingProps {
  onImport: (data: WineType[]) => void
}

export function Onboarding({ onImport }: OnboardingProps) {
  const { parseFile, isParsing, error } = useFileParser()

  const handleFile = useCallback(
    async (file: File) => {
      const data = await parseFile(file)
      if (data.length > 0) {
        onImport(data)
      }
    },
    [parseFile, onImport]
  )

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        {/* Logo / Branding */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Wine className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Ma Cave a Vins</h1>
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            Votre sommelier personnel.
            <br />
            Importez votre cave pour commencer.
          </p>
        </div>

        {/* Import Zone */}
        <ImportZone onFileSelected={handleFile} isParsing={isParsing} />

        {/* Error Message */}
        {error && (
          <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Supported formats hint */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Compatible avec les exports Vivino, CellarTracker et tout fichier Excel avec des colonnes structurees.
        </p>
      </div>
    </div>
  )
}
