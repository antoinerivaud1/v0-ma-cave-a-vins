'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, MessageSquare } from 'lucide-react'
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
const colorDotClasses: Record<string, string> = {
red: 'bg-red-500',
white: 'bg-amber-200',
sparkling: 'bg-sky-300',
unknown: 'bg-muted-foreground',
}
const colorBadgeVariant: Record<string, 'gold' | 'muted'> = {
red: 'gold',
white: 'muted',
sparkling: 'muted',
unknown: 'muted',
}
const SWIPE_THRESHOLD = 72
const SWIPE_REVEAL = 144 // width of the revealed action buttons area
export function WineCard({ wine, onWineUpdate }: WineCardProps) {
const [isOpen, setIsOpen] = useState(false)
const [touchX, setTouchX] = useState(0)
const [isSwiped, setIsSwiped] = useState(false)
const cardRef = useRef<HTMLDivElement>(null)
const touchStartRef = useRef(0)
const touchStartYRef = useRef(0)
const isHorizontalRef = useRef<boolean | null>(null)
const { getOverride, setOverride } = useStockOverrides()
const apogee = getApogee(wine)
const color = getColor(wine.wine_type || '')
const icon = getIcon(wine.wine_type || '')
const label = getLabel(wine.wine_type || '')
const region = formatRegion(wine.wine_region || '')
const hasNote = !!(wine.bottle_comment || wine.wine_comment || wine.wine_notes)
const note = wine.bottle_comment || wine.wine_comment || wine.wine_notes || ''
const override = getOverride(wine.wine_name, wine.millesime_year)
const displayQuantity = override?.quantity !== undefined ? override.quantity : (wine.bottle
const isArchived = override?.archived || false
const apogeeBadgeVariant = apogee
? (apogee.st as 'urgent' | 'ok' | 'wait' | 'late')
: undefined
// Close swipe when card is tapped
const handleCardTap = () => {
if (isSwiped) {
setIsSwiped(false)
setTouchX(0)
return
}
setIsOpen((prev) => !prev)
}
useEffect(() => {
const el = cardRef.current
if (!el) return
const handleTouchStart = (e: TouchEvent) => {
touchStartRef.current = e.touches[0].clientX
touchStartYRef.current = e.touches[0].clientY
isHorizontalRef.current = null // reset direction detection
}
const handleTouchMove = (e: TouchEvent) => {
const deltaX = e.touches[0].clientX - touchStartRef.current
const deltaY = e.touches[0].clientY - touchStartYRef.current
// Detect direction on first meaningful movement
if (isHorizontalRef.current === null) {
const absDeltaX = Math.abs(deltaX)
const absDeltaY = Math.abs(deltaY)
if (absDeltaX < 8 && absDeltaY < 8) return // not enough movement yet
isHorizontalRef.current = absDeltaX > absDeltaY
}
if (!isHorizontalRef.current) return // vertical — let scroll work
// Horizontal swipe confirmed
e.preventDefault()
if (isSwiped) {
// Already swiped open — allow swiping back right
const newX = Math.min(0, -SWIPE_REVEAL + deltaX)
setTouchX(newX)
} else {
// Only allow left swipe (negative deltaX)
const newX = Math.min(0, deltaX)
setTouchX(newX)
}
}
const handleTouchEnd = (e: TouchEvent) => {
const finalDeltaX = e.changedTouches[0].clientX - touchStartRef.current
if (!isHorizontalRef.current) return
if (!isSwiped && finalDeltaX < -SWIPE_THRESHOLD) {
// Swiped left far enough — reveal actions
setIsSwiped(true)
setTouchX(-SWIPE_REVEAL)
} else if (isSwiped && finalDeltaX > SWIPE_THRESHOLD) {
// Swiped right — close
setIsSwiped(false)
setTouchX(0)
} else {
// Snap back to current state
setTouchX(isSwiped ? -SWIPE_REVEAL : 0)
}
isHorizontalRef.current = null
}
el.addEventListener('touchstart', handleTouchStart, { passive: true })
el.addEventListener('touchmove', handleTouchMove, { passive: false })
el.addEventListener('touchend', handleTouchEnd, { passive: true })
return () => {
el.removeEventListener('touchstart', handleTouchStart)
el.removeEventListener('touchmove', handleTouchMove)
el.removeEventListener('touchend', handleTouchEnd)
}
}, [isSwiped]) // re-attach when isSwiped changes
// Stock actions
const handleConsume = () => {
const newQty = Math.max(0, displayQuantity - 1)
setOverride(wine.wine_name, wine.millesime_year, { ...override, quantity: newQty })
setIsSwiped(false)
setTouchX(0)
}
const handleArchive = () => {
setOverride(wine.wine_name, wine.millesime_year, { ...override, archived: true })
setIsSwiped(false)
setTouchX(0)
}
const handleQuantityChange = (qty: number) => {
setOverride(wine.wine_name, wine.millesime_year, { ...override, quantity: qty })
}
const handleRestore = () => {
setOverride(wine.wine_name, wine.millesime_year, { ...override, archived: false })
}
const handleDelete = () => {
setOverride(wine.wine_name, wine.millesime_year, { ...override, deleted: true })
}
return (
// Outer container: clips the swipe reveal, no overflow visible
<div className="relative overflow-hidden rounded-xl border border-cave-border bg-card">
{/* Swipe action buttons — revealed behind the card on left swipe */}
<div className="absolute inset-y-0 right-0 flex items-stretch" style={{ width: SWIPE_RE
<button
onClick={handleConsume}
className="flex flex-1 flex-col items-center justify-center gap-1 bg-amber-500/90 t
>
<span className="text-lg"> </span>
Consommée
</button>
<button
onClick={handleArchive}
className="flex flex-1 flex-col items-center justify-center gap-1 bg-muted text-mut
>
<span className="text-lg"> </span>
Archiver
</button>
</div>
{/* Card content — slides left on swipe via transform */}
<div
ref={cardRef}
style={{
transform: `translateX(${touchX}px)`,
transition: Math.abs(touchX) > 0 && isHorizontalRef.current ? 'none' : 'transform 0
willChange: 'transform',
}}
className="relative z-10 bg-card"
>
{/* Main row — tappable */}
<button
onClick={handleCardTap}
className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
aria-expanded={isOpen}
>
{/* Color dot */}
<span
className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg
aria-hidden="true"
>
{icon}
</span>
{/* Text content */}
<div className="min-w-0 flex-1">
<p className="truncate font-serif text-base font-semibold text-foreground">
{sanitizeWineName(wine.wine_name) || sanitizeWineName(wine.wine_appellation) ||
{wine.millesime_year ? (
<span className="ml-1.5 text-sm font-normal text-muted-foreground">
{wine.millesime_year}
</span>
) : null}
</p>
<p className="mt-0.5 truncate text-xs text-muted-foreground">
{wine.wine_domain ? `${sanitizeWineName(wine.wine_domain)}` : ''}
{wine.wine_domain && region ? ' · ' : ''}
{region}
{displayQuantity > 1 ? (
<span className="ml-1 text-primary">{` ×${displayQuantity}`}</span>
) : null}
</p>
</div>
{/* Chevron + Actions */}
<div className="flex items-center gap-2">
<ChevronDown
className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duratio
isOpen ? 'rotate-180' : ''
}`}
/>
<WineCardActions
wineName={sanitizeWineName(wine.wine_name) || 'Vin inconnu'}
millesime={wine.millesime_year}
currentQuantity={displayQuantity}
isArchived={isArchived}
onConsume={handleConsume}
onQuantityChange={handleQuantityChange}
onArchive={handleArchive}
onRestore={handleRestore}
onDelete={handleDelete}
/>
</div>
</button>
{/* Badges row */}
<div className="flex flex-wrap items-center gap-1.5 px-3.5 pb-3">
<CaveBadge label={`${icon} ${label}`} variant={colorBadgeVariant[color]} />
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
{hasNote ? (
<div className="flex items-start gap-2">
<MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground
<p className="text-sm leading-relaxed text-foreground">{note}</p>
</div>
) : (
<p className="text-sm text-muted-foreground italic">Aucune note pour ce vin.<
)}
<div className="mt-3">
<WineExpertPanel
region={wine.wine_region}
cepage={typeof wine.wine_classification === 'string' ? wine.wine_classifica
millesime={wine.millesime_year ? parseInt(String(wine.millesime_year)) : un
/>
</div>
</div>
</div>
</div>
</div>
</div>
)
}
