"use client"

interface CaveBadgeProps {
  label: string
  variant?: "gold" | "muted" | "urgent" | "ok" | "wait" | "late"
}

const variantClasses: Record<string, string> = {
  gold: "bg-primary/15 text-primary border-primary/30",
  muted: "bg-secondary text-muted-foreground border-ink",
  urgent: "bg-destructive/15 text-destructive border-destructive/30",
  ok: "bg-emerald-950/40 text-emerald-400 border-emerald-800/40",
  wait: "bg-sky-950/40 text-sky-400 border-sky-800/40",
  late: "bg-amber-950/40 text-amber-400 border-amber-800/40",
}

export function CaveBadge({ label, variant = "gold" }: CaveBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {label}
    </span>
  )
}
