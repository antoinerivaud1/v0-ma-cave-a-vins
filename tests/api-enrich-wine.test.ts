import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getUserMock = vi.fn()
const anthropicCreateMock = vi.fn()
const fromMock = vi.fn()

// Helper : crée un mock de chaîne Supabase (select, eq, single, upsert, maybeSingle)
function makeSupabaseChain(resolveValue: unknown) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.single = vi.fn().mockResolvedValue(resolveValue)
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  chain.upsert = vi.fn(() => chain)
  return chain
}

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      getUser: getUserMock,
    },
    from: fromMock,
  })),
}))

vi.mock("@anthropic-ai/sdk", () => ({
  default: class AnthropicMock {
    messages = {
      create: anthropicCreateMock,
    }
  },
}))

describe("POST /api/enrich-wine", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.ANTHROPIC_API_KEY = "test-key"

    // Par défaut : profil avec plan collector pour que le gate plan passe
    fromMock.mockReturnValue(
      makeSupabaseChain({ data: { plan: "collector", role: null }, error: null })
    )
  })

  it("returns 401 when the user is not authenticated", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })

    const { POST } = await import("@/app/api/enrich-wine/route")
    const request = new NextRequest("http://localhost/api/enrich-wine", {
      method: "POST",
      body: JSON.stringify({ wineName: "Chablis" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it("sanitizes unsafe image URLs returned by the model", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } })
    anthropicCreateMock.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            description: "Vin de test",
            cepages: ["Chardonnay"],
            apogee: { debut: 2025, fin: 2029 },
            prixMoyen: "25€",
            notes: "92/100",
            noteSummary: "Tres bien",
            source: "Source test",
            bottle_image_url: "javascript:alert(1)",
            taste_profile: {
              body: 50,
              tannin: 0,
              acidity: 70,
              complexity: 60,
            },
          }),
        },
      ],
    })

    const { POST } = await import("@/app/api/enrich-wine/route")
    const request = new NextRequest("http://localhost/api/enrich-wine", {
      method: "POST",
      body: JSON.stringify({
        wineName: "Chablis",
        millesime: 2020,
        region: "Bourgogne",
      }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.bottle_image_url).toBeNull()
    expect(typeof body.enrichedAt).toBe("number")
  })
})
