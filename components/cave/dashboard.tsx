'use client'

import { useMemo } from 'react'
import { Wine, GlassWater, Sparkles, Star, Clock, AlertTriangle } from 'lucide-react'
import { PageHeader } from './page-header'
import { CaveBadge } from './cave-badge'
import { getApogee } from '@/data/apogee'
import type { Wine as WineType } from '@/data/apogee'
import type { TabId } from './bottom-nav'

interface DashboardProps {
  cave: WineType[]
  onNavigate: (tab: TabId) => void
}

interface StatCard {
  label: string
  value: number
  icon: React.ElementType
  color: string
}

export function Dashboard({ cave, onNavigate }: DashboardProps) {
  const stats = useMemo(() => {
    const total = cave.reduce((sum, w) => sum + (Number(w.bottle_quantity) || 0), 0)

    const reds = cave
      .filter((w) => w.wine_type === 'wine_red' || w.wine_color === 'Rouge')
      .reduce((s, w) => s + (Number(w.bottle_quantity) || 0), 0)

    const whites = cave
      .filter(
        (w) =>
          w.wine_type === 'wine_white' ||
          w.wine_color === 'Blanc'
      )
      .reduce((s, w) => s + (Number(w.bottle_quantity) || 0), 0)

    const sparkling = cave
      .filter(
        (w) =>
          w.wine_type === 'wine_white_sparkling' ||
          w.wine_color === 'Petillant' ||
          w.wine_color === 'Effervescent'
      )
      .reduce((s, w) => s + (Number(w.bottle_quantity) || 0), 0)

    const exceptional = cave
      .filter(
        (w) =>
          w.wine_classification === 'Grand Cru' ||
          w.wine_classification === 'Premier Cru' ||
          w.wine_classification === '1er Cru'
      )
      .reduce((s, w) => s + (Number(w.bottle_quantity) || 0), 0)

    // Wines that are past or near apogee
    const toDrink = cave.filter((w) => {
      const a = getApogee(w)
      return a && (a.st === 'urgent' || a.st === 'late')
    })

    return { total, reds, whites, sparkling, exceptional, toDrink }
  }, [cave])

  const cards: StatCard[] = [
    { label: 'Bouteilles', value: stats.total, icon: Wine, color: 'text-primary' },
    { label: 'Rouges', value: stats.reds, icon: Wine, color: 'text-red-400' },
    { label: 'Blancs', value: stats.whites, icon: GlassWater, color: 'text-amber-200' },
    { label: 'Petillants', value: stats.sparkling, icon: Sparkles, color: 'text-sky-300' },
    { label: 'Exceptionnels', value: stats.exceptional, icon: Star, color: 'text-primary' },
    { label: 'A boire', value: stats.toDrink.length, icon: Clock, color: 'text-amber-400' },
  ]

  return (
    <div className="pb-4">
      <PageHeader title="Ma Cave" subtitle={`${stats.total} bouteilles au total`} />

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-3">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={() => onNavigate('liste')}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-cave-border bg-card p-3 transition-colors hover:border-primary/30"
          >
            <card.icon className={`h-5 w-5 ${card.color}`} />
            <span className="font-serif text-2xl font-semibold text-foreground">{card.value}</span>
            <span className="text-[11px] text-muted-foreground">{card.label}</span>
          </button>
        ))}
      </div>

      {/* Alerts Section */}
      {stats.toDrink.length > 0 && (
        <section className="mt-6 px-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h2 className="font-serif text-lg font-medium text-foreground">A ne pas oublier</h2>
          </div>
          <div className="flex flex-col gap-2">
            {stats.toDrink.slice(0, 5).map((wine, i) => {
              const apogee = getApogee(wine)
              return (
                <div
                  key={`${wine.wine_name}-${i}`}
                  className="flex items-center justify-between rounded-lg border border-cave-border bg-card px-3 py-2.5"
                >
                  <div className="flex-1 pr-3">
                    <p className="text-sm font-medium text-foreground">
                      {wine.wine_name || wine.wine_appellation || 'Vin inconnu'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {wine.millesime_year} {wine.wine_region ? `- ${wine.wine_region}` : ''}
                    </p>
                  </div>
                  {apogee && (
                    <CaveBadge
                      label={apogee.st === 'urgent' ? 'Urgent' : 'Bientot'}
                      variant={apogee.st === 'urgent' ? 'urgent' : 'late'}
                    />
                  )}
                </div>
              )
            })}
            {stats.toDrink.length > 5 && (
              <button
                onClick={() => onNavigate('liste')}
                className="py-1 text-center text-xs text-primary"
              >
                Voir les {stats.toDrink.length - 5} autres...
              </button>
            )}
          </div>
        </section>
      )}

      {/* Empty state if no alerts */}
      {stats.toDrink.length === 0 && stats.total > 0 && (
        <section className="mt-6 px-4">
          <div className="rounded-xl border border-cave-border bg-card p-6 text-center">
            <p className="font-serif text-base text-foreground">Tout va bien !</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Aucun vin ne necessite votre attention immediate.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
