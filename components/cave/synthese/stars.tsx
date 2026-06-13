"use client"

interface StarsProps {
  n: number
  size?: number
  color?: string
}

function StarIcon({ size, filled }: { size: number; filled: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <polygon points="12 2 15 9 22 9.3 16.5 14 18.3 21 12 17.3 5.7 21 7.5 14 2 9.3 9 9" />
    </svg>
  )
}

export function Stars({ n, size = 14, color = "currentColor" }: StarsProps) {
  return (
    <span style={{ display: "inline-flex", gap: 2, color }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} size={size} filled={i <= n} />
      ))}
    </span>
  )
}
