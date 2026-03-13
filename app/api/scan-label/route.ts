import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

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

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configuree" },
      { status: 503 }
    )
  }

  try {
    const { imageBase64, mediaType } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: "Image manquante" }, { status: 400 })
    }

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
                media_type: mediaType || "image/jpeg",
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

    const text = response.content[0].type === "text" ? response.content[0].text : ""

    let result: ScanLabelResult
    try {
      result = JSON.parse(text.trim())
    } catch {
      result = { confidence: "low", rawText: text }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[scan-label] Error:", error)
    return NextResponse.json(
      { error: error?.message || "Erreur interne" },
      { status: 500 }
    )
  }
}
