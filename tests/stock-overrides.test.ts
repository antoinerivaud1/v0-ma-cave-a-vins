import { describe, expect, it } from "vitest"
import { getWineIdentityKey, getEffectiveWineState } from "@/lib/stock-overrides"
import {
  STOCK_SYNC_EPOCH,
  mergeStockOverrides,
  overrideToRow,
  parseStockOverrideRows,
  rowToOverride,
  type StockOverrideRow,
} from "@/lib/stock-sync"

describe("stock overrides identity", () => {
  it("uses the persisted id when available", () => {
    expect(
      getWineIdentityKey({
        id: "wine-123",
        cave_id: "cave-a",
        wine_name: "Chablis",
        millesime_year: 2020,
      })
    ).toBe("id:wine-123")
  })

  it("falls back to a stable composite key including cave and wine metadata", () => {
    expect(
      getWineIdentityKey({
        cave_id: "cave-a",
        wine_name: "Chablis",
        millesime_year: 2020,
        wine_domain: "Domaine Test",
        wine_appellation: "Petit Chablis",
      })
    ).toBe("fallback:cave-a:Chablis:2020:Domaine Test:Petit Chablis")
  })
})

describe("effective wine state", () => {
  it("applies quantity overrides and hides empty wines", () => {
    const state = getEffectiveWineState(
      {
        wine_name: "Chablis",
        bottle_quantity: 3,
      },
      { quantity: 0 }
    )

    expect(state.quantity).toBe(0)
    expect(state.isVisible).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// MA-113 : mapping et fusion local / cloud
// ---------------------------------------------------------------------------

function row(partial: Partial<StockOverrideRow> & { wine_identity_key: string }): StockOverrideRow {
  return { stock: null, archived: false, deleted: false, updated_at: "2026-10-29T10:00:00.000Z", ...partial }
}

describe("mapping stock_overrides", () => {
  it("convertit une surcharge en ligne (quantity devient stock, borné à 0)", () => {
    expect(overrideToRow("id:w1", { quantity: -2, archived: true }, "2026-10-29T10:00:00Z")).toEqual({
      wine_identity_key: "id:w1",
      stock: 0,
      archived: true,
      deleted: false,
      updated_at: "2026-10-29T10:00:00.000Z",
    })
  })

  it("garde stock à null quand seule l'archive est surchargée", () => {
    const pushed = overrideToRow("id:w1", { archived: true }, "2026-10-29T10:00:00Z")
    expect(pushed.stock).toBeNull()
    expect(rowToOverride(pushed)).toEqual({ archived: true })
  })

  it("traite une ligne neutre comme une absence de surcharge", () => {
    expect(rowToOverride(row({ wine_identity_key: "id:w1" }))).toBeUndefined()
  })

  it("aller-retour sans perte", () => {
    const override = { quantity: 2, deleted: true }
    expect(rowToOverride(overrideToRow("id:w1", override, "2026-10-29T10:00:00Z"))).toEqual(override)
  })

  it("valide la réponse brute de Supabase et normalise les dates", () => {
    expect(
      parseStockOverrideRows([
        { wine_identity_key: "id:w1", stock: 1, archived: false, deleted: false, updated_at: "2026-10-29T10:00:00+00:00" },
        { wine_identity_key: "", stock: 1 },
        null,
        "texte",
      ])
    ).toEqual([row({ wine_identity_key: "id:w1", stock: 1 })])
    expect(parseStockOverrideRows(null)).toEqual([])
  })
})

describe("mergeStockOverrides (Supabase source de vérité, dernier écrit gagne)", () => {
  it("prend la valeur cloud quand rien n'est en attente localement", () => {
    const result = mergeStockOverrides(
      { overrides: { "id:w1": { quantity: 5 } }, updatedAt: { "id:w1": "2026-10-29T09:00:00Z" }, pending: [] },
      [row({ wine_identity_key: "id:w1", stock: 1 })]
    )
    expect(result.overrides).toEqual({ "id:w1": { quantity: 1 } })
    expect(result.toPush).toEqual([])
  })

  it("garde et envoie la modification locale plus récente que le cloud", () => {
    const result = mergeStockOverrides(
      { overrides: { "id:w1": { quantity: 0, archived: true } }, updatedAt: { "id:w1": "2026-10-29T11:00:00Z" }, pending: ["id:w1"] },
      [row({ wine_identity_key: "id:w1", stock: 3, updated_at: "2026-10-29T10:00:00Z" })]
    )
    expect(result.overrides["id:w1"]).toEqual({ quantity: 0, archived: true })
    expect(result.toPush).toEqual([
      { wine_identity_key: "id:w1", stock: 0, archived: true, deleted: false, updated_at: "2026-10-29T11:00:00.000Z" },
    ])
  })

  it("laisse gagner le cloud quand il est plus récent que la modification locale", () => {
    const result = mergeStockOverrides(
      { overrides: { "id:w1": { quantity: 2 } }, updatedAt: { "id:w1": "2026-10-29T10:00:00Z" }, pending: ["id:w1"] },
      [row({ wine_identity_key: "id:w1", stock: 5, updated_at: "2026-10-29T10:05:00Z" })]
    )
    expect(result.overrides["id:w1"]).toEqual({ quantity: 5 })
    expect(result.updatedAt["id:w1"]).toBe("2026-10-29T10:05:00.000Z")
    expect(result.toPush).toEqual([])
  })

  it("en cas d'égalité, le cloud gagne", () => {
    const result = mergeStockOverrides(
      { overrides: { "id:w1": { quantity: 2 } }, updatedAt: { "id:w1": "2026-10-29T10:00:00Z" }, pending: ["id:w1"] },
      [row({ wine_identity_key: "id:w1", stock: 5 })]
    )
    expect(result.overrides["id:w1"]).toEqual({ quantity: 5 })
    expect(result.toPush).toEqual([])
  })

  it("les surcharges locales héritées (horodatage 1970) ne remplacent jamais le cloud", () => {
    const result = mergeStockOverrides(
      {
        overrides: { "id:w1": { quantity: 4 }, "id:w2": { archived: true } },
        updatedAt: { "id:w1": STOCK_SYNC_EPOCH, "id:w2": STOCK_SYNC_EPOCH },
        pending: ["id:w1", "id:w2"],
      },
      [row({ wine_identity_key: "id:w1", stock: 1, updated_at: "2026-10-01T00:00:00Z" })]
    )
    expect(result.overrides).toEqual({ "id:w1": { quantity: 1 }, "id:w2": { archived: true } })
    expect(result.toPush.map((r) => r.wine_identity_key)).toEqual(["id:w2"])
  })

  it("retire une clé locale non en attente qui n'existe plus dans le cloud", () => {
    const result = mergeStockOverrides(
      { overrides: { "id:w1": { quantity: 2 } }, updatedAt: { "id:w1": "2026-10-29T10:00:00Z" }, pending: [] },
      []
    )
    expect(result.overrides).toEqual({})
    expect(result.toPush).toEqual([])
  })

  it("envoie une suppression locale récente sous forme de ligne neutre", () => {
    const result = mergeStockOverrides(
      { overrides: {}, updatedAt: { "id:w1": "2026-10-29T11:00:00Z" }, pending: ["id:w1"] },
      [row({ wine_identity_key: "id:w1", stock: 2 })]
    )
    expect(result.overrides).toEqual({})
    expect(result.toPush).toEqual([
      { wine_identity_key: "id:w1", stock: null, archived: false, deleted: false, updated_at: "2026-10-29T11:00:00.000Z" },
    ])
  })

  it("n'envoie rien pour une clé en attente absente des deux côtés", () => {
    const result = mergeStockOverrides(
      { overrides: {}, updatedAt: { "id:w1": "2026-10-29T11:00:00Z" }, pending: ["id:w1"] },
      []
    )
    expect(result.toPush).toEqual([])
  })

  it("ignore une ligne cloud dupliquée (une seule entrée par clé)", () => {
    const result = mergeStockOverrides({ overrides: {}, updatedAt: {}, pending: [] }, [
      row({ wine_identity_key: "id:w1", stock: 1 }),
      row({ wine_identity_key: "id:w1", stock: 9 }),
    ])
    expect(result.overrides).toEqual({ "id:w1": { quantity: 1 } })
  })
})
