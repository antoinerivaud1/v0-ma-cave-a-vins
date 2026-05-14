import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getUserMock = vi.fn()
const fromMock = vi.fn()
const anthropicCreateMock = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
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

describe("POST /api/scan-label", () => {
  function mockPlan(plan: string | null, role: string | null = null) {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: plan === null && role === null ? null : { plan, role },
          }),
        }),
      }),
    })
  }

  beforeEach(() => {
    vi.resetAllMocks()
    process.env.ANTHROPIC_API_KEY = "test-key"
    mockPlan("amateur")
  })

  it("rejects invalid payloads before calling the model", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } })
    mockPlan("amateur")

    const { POST } = await import("@/app/api/scan-label/route")
    const request = new NextRequest("http://localhost/api/scan-label", {
      method: "POST",
      body: JSON.stringify({
        imageBase64: "abc",
        mediaType: "image/heic",
      }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(anthropicCreateMock).not.toHaveBeenCalled()
  })

  it("falls back to a low-confidence result when the model returns invalid JSON", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } })
    mockPlan("amateur")
    anthropicCreateMock.mockResolvedValue({
      content: [{ type: "text", text: "not-json" }],
    })

    const { POST } = await import("@/app/api/scan-label/route")
    const request = new NextRequest("http://localhost/api/scan-label", {
      method: "POST",
      body: JSON.stringify({
        imageBase64: "abc",
        mediaType: "image/jpeg",
      }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.confidence).toBe("low")
    expect(body.rawText).toBe("not-json")
  })

  it("rejects free plan users with 403", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-free" } } })
    mockPlan("free")
    const { POST } = await import("@/app/api/scan-label/route")
    const request = new NextRequest("http://localhost/api/scan-label", {
      method: "POST",
      body: JSON.stringify({ imageBase64: "abc", mediaType: "image/jpeg" }),
      headers: { "Content-Type": "application/json" },
    })
    const response = await POST(request)
    expect(response.status).toBe(403)
    expect(anthropicCreateMock).not.toHaveBeenCalled()
  })

  it("rejects users with no profile row with 403", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-noprofile" } } })
    mockPlan(null, null)
    const { POST } = await import("@/app/api/scan-label/route")
    const request = new NextRequest("http://localhost/api/scan-label", {
      method: "POST",
      body: JSON.stringify({ imageBase64: "abc", mediaType: "image/jpeg" }),
      headers: { "Content-Type": "application/json" },
    })
    const response = await POST(request)
    expect(response.status).toBe(403)
  })

  it("allows amateur plan users", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-amateur" } } })
    mockPlan("amateur")
    anthropicCreateMock.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ wineName: "Test", confidence: "high" }) }],
    })
    const { POST } = await import("@/app/api/scan-label/route")
    const request = new NextRequest("http://localhost/api/scan-label", {
      method: "POST",
      body: JSON.stringify({ imageBase64: "abc", mediaType: "image/jpeg" }),
      headers: { "Content-Type": "application/json" },
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(anthropicCreateMock).toHaveBeenCalled()
  })

  it("allows collector plan users", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-collector" } } })
    mockPlan("collector")
    anthropicCreateMock.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ wineName: "Test", confidence: "high" }) }],
    })
    const { POST } = await import("@/app/api/scan-label/route")
    const request = new NextRequest("http://localhost/api/scan-label", {
      method: "POST",
      body: JSON.stringify({ imageBase64: "abc", mediaType: "image/jpeg" }),
      headers: { "Content-Type": "application/json" },
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it("allows admin role users regardless of plan", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-admin" } } })
    mockPlan("free", "admin")
    anthropicCreateMock.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ wineName: "Test", confidence: "high" }) }],
    })
    const { POST } = await import("@/app/api/scan-label/route")
    const request = new NextRequest("http://localhost/api/scan-label", {
      method: "POST",
      body: JSON.stringify({ imageBase64: "abc", mediaType: "image/jpeg" }),
      headers: { "Content-Type": "application/json" },
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
