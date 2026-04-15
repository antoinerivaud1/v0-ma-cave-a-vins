// Types Supabase — table wine_enrichments (MA-58)

export interface WineEnrichment {
  id: string
  wine_id: string
  user_id: string
  description: string | null
  grape_varieties: { name: string; percentage?: number }[] | null
  taste_profile: {
    body: number
    tannins: number
    acidity: number
    complexity: number
  } | null
  critic_score: number | null
  price_min: number | null
  price_max: number | null
  apogee_start: number | null
  apogee_end: number | null
  apogee_status: "trop_jeune" | "a_boire" | "passe" | null
  food_pairings: string[] | null
  domaine_history: string | null
  domaine_style: string | null
  bottle_image_url: string | null
  created_at: string
  updated_at: string
}
