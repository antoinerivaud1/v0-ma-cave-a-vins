import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { sanitizeWineName } from "@/lib/wine-helpers"
import { checkRateLimit, buildRateLimitHeaders } from "@/lib/rate-limit"

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

const requestSchema = z.object({
  wineName: z.string().trim().min(1).max(200).optional(),
  millesime: z.union([z.string().max(4), z.number().int().min(0).max(9999)]).nullish(),
  region: z.string().trim().max(100).nullish(),
  appellation: z.string().trim().max(100).nullish(),
  wineId: z.string().uuid().optional(),
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
  food_pairings: z.array(z.string()).nullable().default(null),
  domaine_history: z.string().nullable().default(null),
  domaine_style: z.string().nullable().default(null),
})

const SYSTEM_PROMPT = `Tu es un expert sommelier international avec une connaissance encyclopédique des vins du monde entier.
Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks, avec exactement ces champs :
{
  "description": "2-3 phrases concises sur le domaine, le terroir et le style du vin",
  "cepages": ["cépage1", "cépage2"],
  "apogee": { "debut": 2025, "fin": 2035 },
  "prixMoyen": "18-25€",
  "notes": "Score et source (ex: 94/100 · RVF, ou 92pts · Wine Spectator, ou 17/20 · Bettane+Desseauve). OBLIGATOIRE si trouvable — ne pas retourner null si une note existe en ligne.",
  "noteSummary": "1-2 phrases résumant l'avis du critique. Null si aucune note trouvée.",
  "source": "nom ou URL de la source principale",
  "bottle_image_url": "URL directe d'une image de la bouteille ou de l'étiquette (JPG/PNG). Cherche sur wine-searcher.com, vivino.com, millesima.fr ou le site officiel du domaine. Retourne null si introuvable.",
  "taste_profile": {
    "body": "0-100 : intensité du corps (0 = très léger, 100 = très puissant/charpenté)",
    "tannin": "0-100 : niveau de tanins (0 = très souple/soyeux, 100 = très tannique/astringent). Mettre 0 pour vins blancs/rosés/pétillants.",
    "acidity": "0-100 : acidité (0 = très doux/rond, 100 = très acide/vif)",
    "complexity": "0-100 : complexité aromatique (0 = simple/direct, 100 = très complexe/multidimensionnel)"
  },
  "food_pairings": ["accord 1", "accord 2", "accord 3"],
  "domaine_history": "2-3 phrases sur l'histoire du domaine et du vigneron.",
  "domaine_style": "1-2 phrases sur la philosophie et le style de vinification."
}
Estime les valeurs de taste_profile d'après le style du vin, son appellation et son millésime.
food_pairings doit contenir 3 à 5 accords mets-vins concis (ex: "Agneau rôti", "Fromages affinés").
Si une information est introuvable, utilise null pour les champs string et [] pour les tableaux. apogee doit être null si inconnu. bottle_image_url et taste_profile doivent être null si introuvables.`

function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
    return parsed.toString()
  } catch {
    return null
  }
}

async function checkUserPlan(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("plan, role")
    .eq("id", userId)
    .single()
  const raw = data as { plan?: string; role?: string } | null
  const rawPlan = raw?.plan ?? "free"
  const role = raw?.role ?? null
  return (
    rawPlan === "amateur" ||
    rawPlan === "collector" ||
    role === "admin" ||
    role === "beta"
  )
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configurée" },
      { status: 503 }
    )
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 })
  }

  // Gate plan : seuls les utilisateurs payants peuvent déclencher un enrichissement IA
  const canEnrich = await checkUserPlan(supabase, user.id)
  if (!canEnrich) {
    return NextResponse.json(
      { error: "Fonctionnalité réservée aux abonnés Amateur et Collectionneur" },
      { status: 403 }
    )
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  const userRole = (profileData as { role?: string } | null)?.role ?? "user"

  // Rate limiting — admin exempt
  if (userRole !== "admin") {
    const minuteLimit = await checkRateLimit(user.id, "enrich-wine", 10, 1)
    if (!minuteLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans quelques instants." },
        {
          status: 429,
          headers: buildRateLimitHeaders(minuteLimit, 10),
        }
      )
    }

    const hourLimit = await checkRateLimit(user.id, "enrich-wine-hour", 100, 60)
    if (!hourLimit.allowed) {
      return NextResponse.json(
        { error: "Limite horaire atteinte. Réessayez plus tard." },
        {
          status: 429,
          headers: buildRateLimitHeaders(hourLimit, 100),
        }
      )
    }
  }

  try {
    const payload = requestSchema.safeParse(await req.json())
    if (!payload.success) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 })
    }

    let { wineName, millesime, region, appellation, wineId } = payload.data

    // Mode wineId-only : récupérer les informations du vin depuis la table wines
    if (!wineName && wineId) {
      const { data: wineRow } = await supabase
        .from("wines")
        .select("name, vintage, region, appellation")
        .eq("id", wineId)
        .eq("user_id", user.id)
        .single()

      if (!wineRow || !wineRow.name) {
        return NextResponse.json({ error: "Vin introuvable" }, { status: 404 })
      }

      wineName = sanitizeWineName(wineRow.name) || undefined
      millesime = wineRow.vintage ?? undefined
      region = wineRow.region ?? undefined
      appellation = wineRow.appellation ?? undefined
    }

    if (!wineName) {
      return NextResponse.json({ error: "Nom du vin requis" }, { status: 400 })
    }

    const sanitizedName = sanitizeWineName(wineName) || wineName
    const query = [sanitizedName, millesime && `millésime ${millesime}`, appellation, region]
      .filter(Boolean)
      .join(", ")

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Donne-moi des informations sur ce vin : ${query}. Retourne le JSON demandé.`,
        },
      ],
    })

    const finalText = (response.content as Array<{ type: string; text?: string }>)
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("")
      .trim()

    if (!finalText) {
      return NextResponse.json({ error: "Enrichissement impossible" }, { status: 502 })
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

    // Upsert dans wine_enrichments si wineId fourni
    if (wineId) {
      let priceMin: number | null = null
      let priceMax: number | null = null
      if (enrichment.prixMoyen) {
        const priceMatch = enrichment.prixMoyen.match(/(\d+)(?:[^\d]+(\d+))?/)
        if (priceMatch) {
          priceMin = parseInt(priceMatch[1], 10)
          priceMax = priceMatch[2] ? parseInt(priceMatch[2], 10) : priceMin
        }
      }

      let criticScore: number | null = null
      if (enrichment.notes) {
        const scoreMatch = enrichment.notes.match(/(\d{2,3})/)
        if (scoreMatch) {
          criticScore = parseInt(scoreMatch[1], 10)
        }
      }

      const { error: upsertError } = await supabase
        .from("wine_enrichments")
        .upsert(
          {
            wine_id: wineId,
            user_id: user.id,
            description: enrichment.description || null,
            grape_varieties: enrichmentResult.data.cepages.map((name: string) => ({ name })),
            taste_profile: enrichment.taste_profile
              ? {
                  body: enrichment.taste_profile.body,
                  tannins: enrichment.taste_profile.tannin,
                  acidity: enrichment.taste_profile.acidity,
                  complexity: enrichment.taste_profile.complexity,
                }
              : null,
            critic_score: criticScore,
            price_min: priceMin,
            price_max: priceMax,
            apogee_start: enrichment.apogee?.debut ?? null,
            apogee_end: enrichment.apogee?.fin ?? null,
            food_pairings: enrichmentResult.data.food_pairings ?? null,
            domaine_history: enrichmentResult.data.domaine_history ?? null,
            domaine_style: enrichmentResult.data.domaine_style ?? null,
            bottle_image_url: enrichment.bottle_image_url,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "wine_id,user_id" }
        )

      if (upsertError) {
        // Ne pas faire échouer la réponse — le cache est best-effort
      }
    }

    return NextResponse.json(enrichment)
  } catch (error: unknown) {
    return NextResponse.json({ error: "Erreur enrichissement" }, { status: 500 })
  }
}
