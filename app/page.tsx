'use client'

import { useCallback } from 'react'
import { useCave } from '@/hooks/use-cave'
import { Onboarding } from '@/components/cave/onboarding'
import { AppShell } from '@/components/cave/app-shell'
import type { Wine } from '@/data/apogee'

export default function Page() {
  const { cave, saveCave, clearCave, lastUpdated, isLoaded } = useCave()

  const handleImport = useCallback(
    (data: Wine[]) => {
      saveCave(data)
    },
    [saveCave]
  )

  // Wait for localStorage to load before rendering
  if (!isLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  // If no cave data, show onboarding
  if (cave.length === 0) {
    return <Onboarding onImport={handleImport} />
  }

  // Otherwise, show the app shell
  return (
    <AppShell
      cave={cave}
      lastUpdated={lastUpdated}
      onImport={handleImport}
      onClear={clearCave}
    />
  )
}
