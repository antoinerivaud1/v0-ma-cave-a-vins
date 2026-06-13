"use client"

interface WineBottleThumbProps {
  imageUrl?: string | null
  wineType?: string | null
  size?: "sm" | "md"
}

// Synthèse v1 surface tokens — inline styles (no cave-* aliases)
const TYPE_BG: Record<string, { from: string; to: string; bottle: string }> = {
  wine_red:             { from: "#2A100C", to: "#8A2820",  bottle: "var(--rouge)" },
  wine_white:           { from: "#2E3514", to: "#3D5C85",  bottle: "var(--blanc)" },
  wine_white_sparkling: { from: "#1A2535", to: "#2E4A6A",  bottle: "var(--bulle)" },
  wine_rose:            { from: "#5A2035", to: "#B05070",  bottle: "var(--rose)"  },
}
const DEFAULT_SURFACE = { from: "#2A100C", to: "#8A2820", bottle: "var(--rouge)" }

export function WineBottleThumb({ imageUrl, wineType, size = "md" }: WineBottleThumbProps) {
  const surf = (wineType && TYPE_BG[wineType]) ? TYPE_BG[wineType] : DEFAULT_SURFACE

  const w = size === "sm" ? 36 : 48
  const h = size === "sm" ? 54 : 68

  const bgStyle: React.CSSProperties = {
    width: w,
    height: h,
    background: `linear-gradient(to bottom, ${surf.from}, ${surf.to})`,
  }

  if (imageUrl) {
    return (
      <div className="flex-shrink-0 rounded-xl overflow-hidden" style={bgStyle}>
        <img
          src={imageUrl}
          alt="Bouteille"
          className="w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
        />
      </div>
    )
  }

  return (
    <div className="flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center" style={bgStyle}>
      <svg
        width={size === "sm" ? 22 : 28}
        height={size === "sm" ? 40 : 52}
        viewBox="0 0 28 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="10" y="0" width="8" height="6" rx="2" style={{ fill: surf.bottle }} opacity={0.7} />
        <rect x="8" y="5" width="12" height="8" rx="3" style={{ fill: surf.bottle }} opacity={0.85} />
        <path
          d="M6 13 Q5 18 5 24 L5 46 Q5 50 14 50 Q23 50 23 46 L23 24 Q23 18 22 13 Z"
          style={{ fill: surf.bottle }}
        />
        <rect x="6" y="24" width="16" height="14" rx="2" fill="rgba(255,255,255,0.15)" />
      </svg>
    </div>
  )
}
