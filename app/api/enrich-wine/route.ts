import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export interface WineEnrichment {
  description: string
  cepages: string[]
  apogee: { debut: number; fin: number } | null
  prixMoyen: string | null
  notes: string | null
  noteSummary: string | null
  source: string
  enrichedAt: number
  bottle_image_url: string | null
  taste_profile: {
    body: number
    tannin: number
    acidity: number
    complexity: number
  } | null
}

const client = new Anthropic()
const MAX_TEXT_LENGTH = 160

const requestSchema = z.object({
  wineName: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
  millesime: z.union([z.string(), z.number()]).nullish(),
  region: z.string().trim().max(MAX_TEXT_LENGTH).nullish(),
  appellation: z.string().trim().max(MAX_TEXT_LENGTH).nullish(),
})

const responseSchema = z.object({
  description: z.string().trim().default(""),
  cepages: z.array(z.string()).default([]),
  apogee: z.object({
    debut: z.number(),
    fin: z.number(),
  }).nullable().default(null),
  prixMoyen: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  noteSummary: z.string().nullable().default(null),
  source: z.string().trim().min(1).default("Source inconnue"),
  bottle_image_url: z.string().nullable().optional(),
  taste_profile: z.object({
    body: z.number().min(0).max(100),
    tannin: z.number().min(0).max(100),
    acidity: z.number().min(0).max(100),
    complexity: z.number().min(0).max(100),
  }).nullable().default(null),
})

const SYSTEM_PROMPT = `Tu es un expert sommelier international avec une connaissance encyclopédique des vins du monde entier.
Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks, avec exactement ces champs :
{
  "description": "2-3 phrases concises sur le domaine, le terroir et le style du vin",
  "cepages": ["cépage1", "cépage2"],
  "apogee": { "debut": 2025, "fin": 2035 },
  "prixMoyen": "18-25€",
  "notes": "Score et source (ex: 94/100 · RVF, ou 92pts · Wine Spectator, ou 17/20 · Bettane+Desseauve). OBLIGATOIRE si trouvable — ne pas retourner null si une note existe en ligne.",
  "noteSummary": "1-2 phrases résumant l'avis du critique (ex: Tanins soyeux, grande complexité aromatique, apogée dans 5 ans). Null si aucune note trouvée.",
  "source": "nom ou URL de la source principale",
  "bottle_image_url": "URL directe d'une image de la bouteille ou de l'étiquette (JPG/PNG). Cherche sur wine-searcher.com, vivino.com, millesima.fr ou le site officiel du domaine. Retourne null si introuvable.",
  "taste_profile": {
    "body": "0-100 : intensité du corps (0 = très léger, 100 = très puissant/charpenté)",
    "tannin": "0-100 : niveau de tanins (0 = très souple/soyeux, 100 = très tannique/astringent). Mettre 0 pour vins blancs/rosés/pétillants.",
    "acidity": "0-100 : acidité (0 = très doux/rond, 100 = très acide/vif)",
    "complexity": "0-100 : complexité aromatique (0 = simple/direct, 100 = très complexe/multidimensionnel)"
  }
}
Estime les valeurs de taste_profile d'après le style du vin, son appellation et son millésime.
Si une information est introuvable, utilise null pour les champs string et [] pour cepages. apogee doit être null si inconnu. bottle_image_url et taste_profile doivent être null si introuvables.`

function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

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
      { error: "ANTHROPIC_API_KEY non configurée" },
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

    const { wineName, millesime, region, appellation } = payload.data
    const query = [
      wineName,
      millesime && `millésime ${millesime}`,
      appellation,
      region,
    ]
      .filter(Boolean)
      .join(", ")

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Donne-moi des informations sur ce vin : ${query}. Retourne le JSON demandé.`,
        },
      ],
    })

    const finalText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim()

    if (!finalText) {
      return NextResponse.json(
        { error: "Enrichissement impossible" },
        { status: 502 }
      )
    }

    let parsedModelResponse: unknown
    try {
      parsedModelResponse = JSON.parse(finalText)
    } catch {
      return NextResponse.json({ error: "Réponse invalide du modèle" }, { status: 502 })
    }

    const enrichmentResult = responseSchema.safeParse(parsedModelResponse)
    if (!enrichmentResult.success) {
      return NextResponse.json({ error: "Réponse invalide du modèle" }, { status: 502 })
    }

    const enrichment: WineEnrichment = {
      ...enrichmentResult.data,
      enrichedAt: Date.now(),
      bottle_image_url: sanitizeImageUrl(enrichmentResult.data.bottle_image_url),
    }

    return NextResponse.json(enrichment)
  } catch (error: unknown) {
    console.error("[enrich-wine] Request failed:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
