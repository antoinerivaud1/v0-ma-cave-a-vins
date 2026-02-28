'use client'

import { UtensilsCrossed, ChefHat } from 'lucide-react'
import { PageHeader } from './page-header'
import type { Wine } from '@/data/apogee'

interface SuggestProps {
  cave: Wine[]
}

const SAMPLE_PAIRINGS = [
  { dish: 'Boeuf bourguignon', type: 'Rouge', region: 'Bourgogne' },
  { dish: 'Plateau de fromages', type: 'Rouge / Blanc', region: 'Toutes' },
  { dish: 'Saumon grille', type: 'Blanc', region: 'Val de Loire' },
  { dish: 'Foie gras', type: 'Blanc moelleux', region: 'Bordeaux / Alsace' },
  { dish: 'Tarte tatin', type: 'Petillant', region: 'Val de Loire' },
]

export function Suggest({ cave }: SuggestProps) {
  return (
    <div className="pb-4">
      <PageHeader title="Accords Mets & Vins" subtitle="Trouvez le vin parfait pour chaque plat" />

      <div className="mt-4 flex flex-col gap-2 px-4">
        {SAMPLE_PAIRINGS.map((pairing) => (
          <div
            key={pairing.dish}
            className="flex items-center gap-3 rounded-lg border border-cave-border bg-card px-4 py-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <ChefHat className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{pairing.dish}</p>
              <p className="text-xs text-muted-foreground">
                {pairing.type} - {pairing.region}
              </p>
            </div>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </div>

      {cave.length > 0 && (
        <div className="mt-6 mx-4 rounded-xl border border-cave-border bg-card p-5 text-center">
          <p className="font-serif text-base text-foreground">Fonctionnalite a venir</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Les suggestions personnalisees basees sur votre cave seront disponibles prochainement.
          </p>
        </div>
      )}
    </div>
  )
}
