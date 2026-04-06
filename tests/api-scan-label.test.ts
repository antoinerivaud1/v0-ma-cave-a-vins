import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getUserMock = vi.fn()
const anthropicCreateMock = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      getUser: getUserMock,
    },
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
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.ANTHROPIC_API_KEY = "test-key"
  })

  it("rejects invalid payloads before calling the model", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } })

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
})
