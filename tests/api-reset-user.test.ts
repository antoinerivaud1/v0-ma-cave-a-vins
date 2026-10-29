import { beforeEach, describe, expect, it, vi } from "vitest"

// MA-113 : le reset complet vide bien stock_overrides (en premier), avec la clé service_role.

const { getUserMock, deletedTables, failOn } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  deletedTables: [] as { table: string; userId: string }[],
  failOn: { table: null as string | null },
}))

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({ auth: { getUser: getUserMock } })),
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: (table: string) => ({
      delete: () => ({
        eq: async (_column: string, userId: string) => {
          if (failOn.table === table) return { error: { message: "boom" } }
          deletedTables.push({ table, userId })
          return { error: null }
        },
      }),
      update: () => ({ eq: async () => ({ error: null }) }),
    }),
  })),
}))

describe("POST /api/reset-user", () => {
  beforeEach(() => {
    deletedTables.length = 0
    failOn.table = null
    getUserMock.mockReset()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("refuse sans session", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const { POST } = await import("@/app/api/reset-user/route")

    const response = await POST()

    expect(response.status).toBe(401)
    expect(deletedTables).toEqual([])
  })

  it("vide stock_overrides en premier puis tastings, wines et caves de l'utilisateur", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-a" } } })
    const { POST } = await import("@/app/api/reset-user/route")

    const response = await POST()

    expect(response.status).toBe(200)
    expect(deletedTables).toEqual([
      { table: "stock_overrides", userId: "user-a" },
      { table: "tastings", userId: "user-a" },
      { table: "wines", userId: "user-a" },
      { table: "caves", userId: "user-a" },
    ])
  })

  it("s'arrête et renvoie une erreur si stock_overrides ne peut pas être vidée", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-a" } } })
    failOn.table = "stock_overrides"
    const { POST } = await import("@/app/api/reset-user/route")

    const response = await POST()

    expect(response.status).toBe(500)
    expect(deletedTables).toEqual([])
  })
})
