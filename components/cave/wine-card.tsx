'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, MessageSquare, Wine as WineIcon, Archive } from 'lucide-react'
import { CaveBadge } from './cave-badge'
import { WineExpertPanel } from './wine-expert-panel'
import { WineCardActions } from './wine-card-actions'
import { useStockOverrides } from '@/hooks/use-stock-overrides'
import { getIcon, getLabel, getColor, formatRegion, sanitizeWineName } from '@/lib/wine-helpers'
import { getApogee } from '@/data/apogee'
import type { Wine } from '@/data/apogee'

interface WineCardProps {
  wine: Wine
  onWineUpdate?: (updates: Partial<Wine>) => void
}

export function WineCard({ wine, onWineUpdate }: WineCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [touchX, setTouchX] = useState(0)
  const [isSwiped, setIsSwiped] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef(0)
  const touchStartYRef = useRef(0)
  const isHorizontalRef = useRef(false)
  const { getOverride, setOverride } = useStockOverrides()

  const apogee = getApogee(wine)
  const color = getColor(wine.wine_type || '')
  const icon = getIcon(wine.wine_type || '')
  const label = getLabel(wine.wine_type || '')
  const region = formatRegion(wine.wine_region || '')
  const hasNote = !!(wine.bottle_comment || wine.wine_comment || wine.wine_notes)
  const note = wine.bottle_comment || wine.wine_comment || wine.wine_notes || ''
  
  const override = getOverride(wine.wine_name, wine.millesime_year)
  const displayQuantity = override?.quantity !== undefined ? override.quantity : (wine.bottle_quantity || 1)
  const isArchived = override?.archived || false

  const apogeeBadgeVariant = apogee
    ? (apogee.st as 'urgent' | 'ok' | 'wait' | 'late')
    : undefined

  // Touch swipe with direction detection
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX
    touchStartYRef.current = e.touches[0].clientY
    isHorizontalRef.current = false
  }

  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const handleTouchMove = (e: TouchEvent) => {
      const deltaX = e.touches[0].clientX - touchStartRef.current
      const deltaY = e.touches[0].clientY - touchStartYRef.current

      // Detect direction on first meaningful movement
      if (!isHorizontalRef.current) {
        const absDeltaX = Math.abs(deltaX)
        const absDeltaY = Math.abs(deltaY)

        if (absDeltaX < 5 && absDeltaY < 5) {
          // Not enough movement yet — stay neutral
          return
        }
        isHorizontalRef.current = absDeltaX > absDeltaY
      }

      // Horizontal swipe confirmed — prevent scrolling
      if (isHorizontalRef.current) {
        e.preventDefault()
        const constrainedX = Math.min(0, deltaX)
        setTouchX(constrainedX)
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const finalDelta = e.changedTouches[0].clientX - touchStartRef.current

      if (isHorizontalRef.current && finalDelta < -72) {
        // Swiped left past 72px threshold
        setTouchX(-144)
        setIsSwiped(true)
      } else {
        // Snap back
        setTouchX(0)
        setIsSwiped(false)
      }
      isHorizontalRef.current = false
    }

    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)

    return () => {
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  // Stock actions
  const handleConsume = () => {
    const newQty = Math.max(0, displayQuantity - 1)
    setOverride(wine.wine_name, wine.millesime_year, {
      ...override,
      quantity: newQty,
    })
    setTouchX(0)
    setIsSwiped(false)
  }

  const handleArchive = () => {
    setOverride(wine.wine_name, wine.millesime_year, {
      ...override,
      archived: true,
    })
    setTouchX(0)
    setIsSwiped(false)
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-cave-border bg-card transition-colors" style={{ touchAction: 'pan-y' }}>
      {/* Action buttons revealed on swipe — behind the card */}
      <div className="absolute right-0 top-0 h-full w-36 flex items-center justify-end gap-1 px-2 bg-gradient-to-l from-black/5 to-transparent">
        <button
          onClick={handleConsume}
          className="flex h-10 w-16 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
          title="Consommée"
        >
          <WineIcon className="h-4 w-4" />
        </button>
        <button
          onClick={handleArchive}
          className="flex h-10 w-16 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          title="Archiver"
        >
          <Archive className="h-4 w-4" />
        </button>
      </div>

      {/* Swipeable inner content */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        className="transition-transform duration-200"
        style={{ touchAction: 'pan-y', transform: `translateX(${touchX}px)` }}
      >
        {/* Main row — tappable */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
          aria-expanded={isOpen}
        >
          {/* Color dot */}
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg bg-${color === 'red' ? 'red-500' : color === 'white' ? 'amber-200' : 'sky-300'}/15`}
            aria-hidden="true"
          >
            {icon}
          </span>

          {/* Text content */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-base font-semibold text-foreground">
              {sanitizeWineName(wine.wine_name) || sanitizeWineName(wine.wine_appellation) || 'Vin inconnu'}
              {wine.millesime_year ? (
                <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                  {wine.millesime_year}
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {wine.wine_domain ? `${sanitizeWineName(wine.wine_domain)}` : ''}
              {wine.wine_domain && region ? ' \u00B7 ' : ''}
              {region}
              {wine.bottle_quantity && wine.bottle_quantity > 1 ? (
                <span className="ml-1 text-primary">{` \u00D7${displayQuantity}`}</span>
              ) : null}
            </p>
          </div>

          {/* Chevron + Actions */}
          <div className="flex items-center gap-2">
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
            <WineCardActions
              wineName={sanitizeWineName(wine.wine_name) || 'Vin inconnu'}
              millesime={wine.millesime_year}
              currentQuantity={displayQuantity}
              isArchived={isArchived}
              onConsume={handleConsume}
              onQuantityChange={() => {}}
              onArchive={handleArchive}
              onRestore={() => {}}
              onDelete={() => {}}
            />
          </div>
        </button>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5 px-3.5 pb-3">
          <CaveBadge label={`${icon} ${label}`} variant="gold" />
          {apogee && apogeeBadgeVariant && (
            <CaveBadge label={apogee.label} variant={apogeeBadgeVariant} />
          )}
        </div>

        {/* Expandable detail section */}
        <div
          className={`grid transition-[grid-template-rows] duration-200 ${
            isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-cave-border px-3.5 py-3">
              {/* Wine note */}
              {hasNote ? (
                <div className="flex items-start gap-2">
                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-sm leading-relaxed text-foreground">{note}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Aucune note pour ce vin.</p>
              )}

              {/* Expert tasting panel */}
              <div className="mt-3">
                <WineExpertPanel
                  region={wine.wine_region}
                  cepage={typeof wine.wine_classification === 'string' ? wine.wine_classification : undefined}
                  millesime={wine.millesime_year ? parseInt(String(wine.millesime_year)) : undefined}
                  wineName={wine.wine_name}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
