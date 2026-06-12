"use client"

import { Watermark } from "./watermark"

interface BigTileProps {
  bg?: string
  fg?: string
  watermark?: string
  label?: string
  big?: React.ReactNode
  sub?: React.ReactNode
  children?: React.ReactNode
  onClick?: () => void
  style?: React.CSSProperties
  shadow?: boolean
  accent?: boolean
}

export function BigTile({
  bg = "var(--paper-2)",
  fg = "var(--ink)",
  watermark,
  label,
  big,
  sub,
  children,
  onClick,
  style = {},
  shadow = true,
  accent = false,
}: BigTileProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: bg,
        color: fg,
        border: "var(--border-hard)",
        borderRadius: "var(--radius-card)",
        boxShadow: shadow
          ? accent
            ? "var(--shadow-accent)"
            : "var(--shadow-hard)"
          : "none",
        padding: 16,
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        containerType: "inline-size",
        ...style,
      }}
    >
      {watermark && <Watermark color={fg}>{watermark}</Watermark>}
      {label && (
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: fg,
            opacity: 0.78,
          }}
        >
          {label}
        </div>
      )}
      {big != null && (
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: 48,
            lineHeight: 1,
            marginTop: 6,
            color: fg,
            position: "relative",
            zIndex: 1,
          }}
        >
          {big}
        </div>
      )}
      {sub && (
        <div
          style={{
            fontSize: 11,
            opacity: 0.75,
            marginTop: 4,
            fontFamily: "var(--font-sans)",
          }}
        >
          {sub}
        </div>
      )}
      {children}
    </div>
  )
}
