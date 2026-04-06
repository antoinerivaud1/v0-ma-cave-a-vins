"use client"

interface WineBottleThumbProps {
  imageUrl?: string | null
  wineType?: string | null
  size?: "sm" | "md"
}

const TYPE_COLORS: Record<string, { bg: string; bottle: string }> = {
  wine_red:             { bg: "from-[#1a0505] to-[#5c1a1a]", bottle: "#7a2020" },
  wine_white:           { bg: "from-[#2a2810] to-[#6b6020]", bottle: "#7a7020" },
  wine_white_sparkling: { bg: "from-[#0a1a2a] to-[#1a3a5a]", bottle: "#2a5a8a" },
  wine_rose:            { bg: "from-[#3a1018] to-[#7a2035]", bottle: "#b05070" },
}

const DEFAULT_COLORS = { bg: "from-[#1a0505] to-[#5c1a1a]", bottle: "#7a2020" }

export function WineBottleThumb({ imageUrl, wineType, size = "md" }: WineBottleThumbProps) {
  const colors = (wineType && TYPE_COLORS[wineType]) ? TYPE_COLORS[wineType] : DEFAULT_COLORS

  const w = size === "sm" ? 36 : 48
  const h = size === "sm" ? 54 : 68

  if (imageUrl) {
    return (
      <div
        className={`flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-b ${colors.bg}`}
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
      className={`flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-b ${colors.bg} flex items-center justify-center`}
      style={{ width: w, height: h }}
    >
      <svg
        width={size === "sm" ? 22 : 28}
        height={size === "sm" ? 40 : 52}
        viewBox="0 0 28 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="10" y="0" width="8" height="6" rx="2" fill={colors.bottle} opacity={0.7} />
        <rect x="8" y="5" width="12" height="8" rx="3" fill={colors.bottle} opacity={0.85} />
        <path
          d="M6 13 Q5 18 5 24 L5 46 Q5 50 14 50 Q23 50 23 46 L23 24 Q23 18 22 13 Z"
          fill={colors.bottle}
        />
        <rect x="6" y="24" width="16" height="14" rx="2" fill="rgba(255,255,255,0.15)" />
      </svg>
    </div>
  )
}
