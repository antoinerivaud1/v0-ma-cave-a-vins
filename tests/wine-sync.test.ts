import { describe, expect, it } from "vitest"
import { getPersistedWineRowIdentityKey, mergeLocalWineSources } from "@/lib/wine-sync"
import type { Wine } from "@/data/apogee"

describe("wine sync identity", () => {
  it("includes cave, domain and appellation to avoid basic collisions", () => {
    const left = getPersistedWineRowIdentityKey({
      cave_id: "cave-a",
      name: "Clos Rouge",
      vintage: "2019",
      domain: "Domaine A",
      appellation: "Pommard",
    })

    const right = getPersistedWineRowIdentityKey({
      cave_id: "cave-a",
      name: "Clos Rouge",
      vintage: "2019",
      domain: "Domaine B",
      appellation: "Pommard",
    })

    expect(left).not.toBe(right)
  })
})

describe("mergeLocalWineSources", () => {
  it("deduplicates the same wine across local sources", () => {
    const caveId = "cave-a"
    const importedWine: Wine = {
      wine_name: "Chablis",
      millesime_year: 2020,
      wine_domain: "Domaine Test",
      wine_appellation: "Petit Chablis",
      bottle_quantity: 2,
    }

    const manualWine: Wine = {
      ...importedWine,
      bottle_quantity: 4,
    }

    const merged = mergeLocalWineSources([importedWine], [manualWine], caveId)

    expect(merged).toHaveLength(1)
    expect(merged[0]?.bottle_quantity).toBe(4)
    expect(merged[0]?.cave_id).toBe(caveId)
  })

  it("keeps same-name wines distinct when domain differs", () => {
    const caveId = "cave-a"
    const importedWine: Wine = {
      wine_name: "Clos Rouge",
      millesime_year: 2019,
      wine_domain: "Domaine A",
      wine_appellation: "Pommard",
      bottle_quantity: 1,
    }

    const manualWine: Wine = {
      wine_name: "Clos Rouge",
      millesime_year: 2019,
      wine_domain: "Domaine B",
      wine_appellation: "Pommard",
      bottle_quantity: 1,
    }

    const merged = mergeLocalWineSources([importedWine], [manualWine], caveId)

    expect(merged).toHaveLength(2)
  })

  it("drops wines with no effective name or non-positive quantity", () => {
    const merged = mergeLocalWineSources(
      [
        { wine_name: "", bottle_quantity: 2 },
        { wine_appellation: "Sans nom", bottle_quantity: 0 },
      ],
      [],
      "cave-a"
    )

    expect(merged).toEqual([])
  })
})
