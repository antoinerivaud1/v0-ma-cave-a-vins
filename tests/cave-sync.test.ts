import { beforeEach, describe, expect, it, vi } from "vitest"

// MA-113 : la migration one-shot ne touche plus stock_overrides dans le callback d'auth
// et ne marque plus le stock comme migré quand l'envoi échoue.

const { startStockOverridesSync, tablesTouched, profile } = vi.hoisted(() => ({
  startStockOverridesSync: vi.fn(),
  tablesTouched: [] as string[],
  profile: { lastActiveCaveId: "cave-1" as string | null },
}))

vi.mock("@/hooks/use-stock-overrides", () => ({ startStockOverridesSync }))

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => {
      tablesTouched.push(table)
      const chain: Record<string, unknown> = {}
      const result = { data: null, error: null }
      chain.select = vi.fn(() => chain)
      chain.eq = vi.fn(() => chain)
      chain.order = vi.fn(() => chain)
      chain.limit = vi.fn(() => chain)
      chain.insert = vi.fn(() => chain)
      chain.update = vi.fn(() => chain)
      chain.upsert = vi.fn(async () => result)
      chain.single = vi.fn(async () =>
        table === "profiles" ? { data: { last_active_cave_id: profile.lastActiveCaveId }, error: null } : result
      )
      chain.then = (resolve: (value: unknown) => unknown) =>
        Promise.resolve(table === "wines" ? { data: [], error: null } : result).then(resolve)
      return chain
    },
  }),
}))

describe("migrateLocalToSupabase (MA-113)", () => {
  beforeEach(() => {
    localStorage.clear()
    tablesTouched.length = 0
    startStockOverridesSync.mockReset()
    profile.lastActiveCaveId = "cave-1"
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("met le stock en file d'attente sans écrire stock_overrides dans le callback d'auth", async () => {
    localStorage.setItem("cave-stock-overrides", JSON.stringify({ "id:w1": { quantity: 0, archived: true } }))
    const { migrateLocalToSupabase } = await import("@/hooks/use-cave-sync")

    const result = await migrateLocalToSupabase("user-a")

    expect(startStockOverridesSync).toHaveBeenCalledWith("user-a")
    expect(tablesTouched).not.toContain("stock_overrides")
    expect(result.errors).toEqual([])
    expect(localStorage.getItem("cave-migration-done")).toBe("true")
  })

  it("relance la synchro du stock même pour un compte déjà marqué migré", async () => {
    localStorage.setItem("cave-migration-done", "true")
    const { migrateLocalToSupabase } = await import("@/hooks/use-cave-sync")

    const result = await migrateLocalToSupabase("user-a")

    expect(startStockOverridesSync).toHaveBeenCalledWith("user-a")
    expect(result).toEqual({ migrated: 0, errors: [] })
    expect(tablesTouched).toEqual([])
  })

  it("ne marque pas la migration terminée si la cave cible est introuvable", async () => {
    profile.lastActiveCaveId = null
    const { migrateLocalToSupabase } = await import("@/hooks/use-cave-sync")

    const result = await migrateLocalToSupabase("user-a")

    expect(result.errors[0]).toMatch(/^cave:/)
    expect(localStorage.getItem("cave-migration-done")).toBeNull()
    expect(startStockOverridesSync).toHaveBeenCalledWith("user-a")
  })
})
