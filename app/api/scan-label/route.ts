import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export interface ScanLabelResult {
  wineName?: string
  domaine?: string
  millesime?: number
  region?: string
  appellation?: string
  cepage?: string
  confidence: "high" | "medium" | "low"
  rawText?: string
}

const client = new Anthropic()
const MAX_IMAGE_BASE64_LENGTH = 10_000_000
const allowedMediaTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const

const requestSchema = z.object({
  imageBase64: z.string().min(1).max(MAX_IMAGE_BASE64_LENGTH),
  mediaType: z.enum(allowedMediaTypes).default("image/jpeg"),
})

const scanResultSchema = z.object({
  wineName: z.string().nullable().optional(),
  domaine: z.string().nullable().optional(),
  millesime: z.number().nullable().optional(),
  region: z.string().nullable().optional(),
  appellation: z.string().nullable().optional(),
  cepage: z.string().nullable().optional(),
  confidence: z.enum(["high", "medium", "low"]),
  rawText: z.string().nullable().optional(),
})

const SYSTEM_PROMPT = `Tu es un expert en vins francais. Analyse l'etiquette de vin dans l'image et extrais les informations suivantes.
Reponds UNIQUEMENT en JSON valide, sans markdown ni backticks, avec exactement ces champs :
{
  "wineName": "nom du vin (sans le domaine)",
  "domaine": "nom du domaine ou chateau",
  "millesime": 2018,
  "region": "region viticole (ex: Bordeaux, Bourgogne, Vallee de la Loire)",
  "appellation": "appellation precise (ex: Saint-Emilion Grand Cru, Pommard)",
  "cepage": "cepage(s) si visible(s)",
  "confidence": "high | medium | low",
  "rawText": "texte brut lu sur l'etiquette"
}
Si une information n'est pas visible, utilise null. confidence = high si tu es sur de la lecture, medium si partiel, low si difficile a lire.`

async function requireAuthenticatedUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configuree" },
      { status: 503 }
    )
  }

  const user = await requireAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 })
  }

  try {
    const payload = requestSchema.safeParse(await req.json())

    if (!payload.success) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 })
    }

    const { imageBase64, mediaType } = payload.data
    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: "Analyse cette etiquette de vin et retourne le JSON demande.",
            },
          ],
        },
      ],
    })

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim()

    let result: ScanLabelResult
    try {
      const rawResult = JSON.parse(text)
      const parsedResult = scanResultSchema.safeParse(rawResult)
      result = parsedResult.success
        ? {
            wineName: parsedResult.data.wineName ?? undefined,
            domaine: parsedResult.data.domaine ?? undefined,
            millesime: parsedResult.data.millesime ?? undefined,
            region: parsedResult.data.region ?? undefined,
            appellation: parsedResult.data.appellation ?? undefined,
            cepage: parsedResult.data.cepage ?? undefined,
            confidence: parsedResult.data.confidence,
            rawText: parsedResult.data.rawText ?? undefined,
          }
        : { confidence: "low", rawText: text.slice(0, 2000) }
    } catch {
      result = { confidence: "low", rawText: text.slice(0, 2000) }
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error("[scan-label] Request failed:", error)
    return NextResponse.json(
      { error: "Erreur analyse image" },
      { status: 500 }
    )
  }
}
