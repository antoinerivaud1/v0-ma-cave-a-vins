"use client"

interface FilterPillProps {
  label: string
  active: boolean
  onClick: () => void
  accent?: boolean
}

export function FilterPill({ label, active, onClick, accent = false }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: "7px 13px",
        borderRadius: 999,
        border: "var(--border-hard)",
        background: active ? "var(--ink)" : accent ? "var(--rouge)" : "var(--bg)",
        color: active ? "var(--bg)" : accent ? "var(--rouge-fg)" : "var(--ink)",
        fontFamily: "var(--font-sans)",
        fontWeight: 600,
        fontSize: 11,
        letterSpacing: "0.02em",
        cursor: "pointer",
        boxShadow: active ? "var(--shadow-hard)" : "none",
        transition: "transform .1s",
      }}
    >
      {label}
    </button>
  )
}
