"use client"

interface StatPillProps {
  label: string
  big: React.ReactNode
  sub?: React.ReactNode
}

export function StatPill({ label, big, sub }: StatPillProps) {
  return (
    <div
      style={{
        background: "var(--bg)",
        color: "var(--ink)",
        border: "var(--border-hard)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-hard)",
        padding: "10px 12px",
        flex: 1,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--ink)",
          opacity: 0.78,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: 26,
          lineHeight: 1,
          marginTop: 4,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {big}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: "var(--ink-soft)", marginTop: 3 }}>
          {sub}
        </div>
      )}
    </div>
  )
}
