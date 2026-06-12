"use client"

interface WatermarkProps {
  children: React.ReactNode
  color?: string
  size?: number | string
  top?: number
  right?: number
  opacity?: number | string
}

export function Watermark({
  children,
  color = "currentColor",
  size,
  top = 8,
  right = 10,
  opacity,
}: WatermarkProps) {
  const op = opacity != null ? opacity : "var(--watermark-opacity, 0.22)"
  const fontSize =
    size != null
      ? typeof size === "number"
        ? `${size}px`
        : size
      : "clamp(20px, 11cqi, 46px)"

  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        top,
        right,
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontWeight: 600,
        fontSize,
        lineHeight: 1,
        color,
        opacity: op as number,
        pointerEvents: "none",
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        maxWidth: "calc(100% - 16px)",
      }}
    >
      {children}
    </span>
  )
}
