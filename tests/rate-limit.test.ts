import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { rpcMock, createClientMock } = vi.hoisted(() => {
  const rpc = vi.fn()
  return { rpcMock: rpc, createClientMock: vi.fn(() => ({ rpc })) }
})

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}))

describe("checkRateLimit (MA-114)", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    createClientMock.mockImplementation(() => ({ rpc: rpcMock }))
  })

  // Depuis MA-114, increment_rate_limit n'est exécutable que par service_role.
  // Si le limiteur passait par la clé anon, l'appel RPC échouerait et checkRateLimit
  // laisserait tout passer (fail-open) : ce test verrouille la clé utilisée.
  it("appelle increment_rate_limit avec la clé service_role, jamais la clé anon", async () => {
    rpcMock.mockResolvedValue({ data: 1, error: null })
    const { checkRateLimit } = await import("@/lib/rate-limit")

    await checkRateLimit("11111111-1111-1111-1111-111111111111", "enrich-wine", 10, 1)

    expect(createClientMock).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    expect(createClientMock).not.toHaveBeenCalledWith(
      expect.anything(),
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    expect(rpcMock).toHaveBeenCalledWith(
      "increment_rate_limit",
      expect.objectContaining({
        p_user_id: "11111111-1111-1111-1111-111111111111",
        p_route: "enrich-wine",
      })
    )
  })

  it("bloque au-delà du maximum de la fenêtre", async () => {
    rpcMock.mockResolvedValue({ data: 11, error: null })
    const { checkRateLimit } = await import("@/lib/rate-limit")

    const result = await checkRateLimit("11111111-1111-1111-1111-111111111111", "enrich-wine", 10, 1)

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })
})

describe("migration MA-114 : fonctions SECURITY DEFINER fermées aux clients", () => {
  const dir = join(process.cwd(), "supabase", "migrations")
  const file = readdirSync(dir).find((name) => name.includes("revoke_security_definer"))
  const sql = file ? readFileSync(join(dir, file), "utf8") : ""

  it("existe dans supabase/migrations", () => {
    expect(file).toBeDefined()
  })

  it.each(["PUBLIC", "anon", "authenticated"])(
    "retire EXECUTE sur increment_rate_limit à %s",
    (role) => {
      expect(sql).toContain(
        `REVOKE EXECUTE ON FUNCTION public.increment_rate_limit(uuid, text, timestamptz) FROM ${role};`
      )
    }
  )

  it.each(["PUBLIC", "anon", "authenticated"])("retire EXECUTE sur rls_auto_enable à %s", (role) => {
    expect(sql).toContain(`REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM ${role};`)
  })

  it("garde service_role et fige le search_path", () => {
    expect(sql).toContain(
      "GRANT EXECUTE ON FUNCTION public.increment_rate_limit(uuid, text, timestamptz) TO service_role;"
    )
    expect(sql).toContain("SET search_path = ''")
  })
})
