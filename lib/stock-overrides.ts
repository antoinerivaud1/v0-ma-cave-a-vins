"use client"

import type { Wine } from "@/data/apogee"

export interface StockOverride {
  quantity?: number
  archived?: boolean
  deleted?: boolean
}

export interface WineIdentity {
  id?: string | null
  cave_id?: string | null
  wine_name?: string | null
  millesime_year?: string | number | null
  wine_domain?: string | null
  wine_appellation?: string | null
}

export interface EffectiveWineState {
  quantity: number
  archived: boolean
  deleted: boolean
  isVisible: boolean
}

function normalizeIdentityPart(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-"
  return String(value).trim()
}

export function getWineIdentityKey(wine: WineIdentity): string {
  if (wine.id) {
    return `id:${normalizeIdentityPart(wine.id)}`
  }

  return [
    "fallback",
    normalizeIdentityPart(wine.cave_id),
    normalizeIdentityPart(wine.wine_name),
    normalizeIdentityPart(wine.millesime_year),
    normalizeIdentityPart(wine.wine_domain),
    normalizeIdentityPart(wine.wine_appellation),
  ].join(":")
}

export function getEffectiveWineState(wine: Wine, override?: StockOverride): EffectiveWineState {
  const baseQuantity = Number(wine.bottle_quantity ?? 0)
  const quantity = Math.max(0, override?.quantity ?? baseQuantity)
  const archived = override?.archived === true
  const deleted = override?.deleted === true

  return {
    quantity,
    archived,
    deleted,
    isVisible: !deleted && !archived && quantity > 0,
  }
}
