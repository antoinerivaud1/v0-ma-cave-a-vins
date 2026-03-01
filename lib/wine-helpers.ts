import { REGIONS } from '@/data/regions'

/** Map wine_type to a color key */
export function getColor(type: string): 'red' | 'white' | 'sparkling' | 'unknown' {
  if (type === 'wine_red') return 'red'
  if (type === 'wine_white') return 'white'
  if (type === 'wine_white_sparkling') return 'sparkling'
  return 'unknown'
}

/** Human-readable label with emoji */
export function getLabel(type: string): string {
  if (type === 'wine_red') return 'Rouge'
  if (type === 'wine_white') return 'Blanc'
  if (type === 'wine_white_sparkling') return 'Petillant'
  return 'Inconnu'
}

/** Emoji icon by wine type */
export function getIcon(type: string): string {
  if (type === 'wine_red') return '\uD83C\uDF77'
  if (type === 'wine_white') return '\uD83E\uDD42'
  return '\u2728'
}

/** Format a wine_region key to a nice label */
export function formatRegion(key: string): string {
  const region = REGIONS[key]
  if (region) return region.label
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
