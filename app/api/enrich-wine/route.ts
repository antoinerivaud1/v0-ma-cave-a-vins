import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

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

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configurée" },
      { status: 503 }
    )
  }

  try {
    const { wineName, millesime, region, appellation } = await req.json()

    if (!wineName) {
      return NextResponse.json({ error: "wineName est requis" }, { status: 400 })
    }

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
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")

    if (!finalText) {
      return NextResponse.json(
        { error: "Enrichissement impossible" },
        { status: 500 }
      )
    }

    let enrichment: WineEnrichment
    try {
      enrichment = JSON.parse(finalText.trim())
      enrichment.enrichedAt = Date.now()
    } catch {
      return NextResponse.json({ error: "Réponse invalide du modèle" }, { status: 500 })
    }

    return NextResponse.json(enrichment)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    // Log complet pour diagnostic
    console.error("[enrich-wine] FULL ERROR:", JSON.stringify({ message, stack, error: String(error) }))
    return NextResponse.json({ error: message, detail: stack }, { status: 500 })
  }
}
