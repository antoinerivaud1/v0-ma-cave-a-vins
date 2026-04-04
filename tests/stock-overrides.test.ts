import { describe, expect, it } from "vitest"
import { getWineIdentityKey, getEffectiveWineState } from "@/lib/stock-overrides"

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
