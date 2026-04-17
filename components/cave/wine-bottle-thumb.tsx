"use client"

interface WineBottleThumbProps {
  imageUrl?: string | null
  wineType?: string | null
  size?: "sm" | "md"
}

const TYPE_BG: Record<string, string> = {
  wine_red:             "from-cave-rouge-noir to-cave-rouge-profond",
  wine_white:           "from-cave-blanc-sombre to-cave-blanc-moyen",
  wine_white_sparkling: "from-cave-bulles-noir to-cave-bulles-profond",
  wine_rose:            "from-cave-rose-sombre to-cave-rose-medium",
}

const TYPE_BOTTLE_VAR: Record<string, string> = {
  wine_red:             "var(--cave-rouge-vif)",
  wine_white:           "var(--cave-blanc-dore)",
  wine_white_sparkling: "var(--cave-bulles-vif)",
  wine_rose:            "var(--cave-rose-vif)",
}

const DEFAULT_BG = "from-cave-rouge-noir to-cave-rouge-profond"
const DEFAULT_BOTTLE_VAR = "var(--cave-rouge-vif)"

export function WineBottleThumb({ imageUrl, wineType, size = "md" }: WineBottleThumbProps) {
  const bg = (wineType && TYPE_BG[wineType]) ? TYPE_BG[wineType] : DEFAULT_BG
  const bottleVar = (wineType && TYPE_BOTTLE_VAR[wineType]) ? TYPE_BOTTLE_VAR[wineType] : DEFAULT_BOTTLE_VAR

  const w = size === "sm" ? 36 : 48
  const h = size === "sm" ? 54 : 68

  if (imageUrl) {
    return (
      <div
        className={`flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-b ${bg}`}
        style={{ width: w, height: h }}
      >
        <img
          src={imageUrl}
          alt="Bouteille"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none"
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={`flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-b ${bg} flex items-center justify-center`}
      style={{ width: w, height: h }}
    >
      <svg
        width={size === "sm" ? 22 : 28}
        height={size === "sm" ? 40 : 52}
        viewBox="0 0 28 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="10" y="0" width="8" height="6" rx="2" style={{ fill: bottleVar }} opacity={0.7} />
        <rect x="8" y="5" width="12" height="8" rx="3" style={{ fill: bottleVar }} opacity={0.85} />
        <path
          d="M6 13 Q5 18 5 24 L5 46 Q5 50 14 50 Q23 50 23 46 L23 24 Q23 18 22 13 Z"
          style={{ fill: bottleVar }}
        />
        <rect x="6" y="24" width="16" height="14" rx="2" fill="rgba(255,255,255,0.15)" />
      </svg>
    </div>
  )
}
