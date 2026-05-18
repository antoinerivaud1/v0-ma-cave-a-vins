"use client"

interface FilterOption {
  key: string
  label: string
}

interface FilterBarProps {
  options: FilterOption[]
  activeKey: string
  onSelect: (key: string) => void
}

export function FilterBar({ options, activeKey, onSelect }: FilterBarProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto px-4 py-2"
      style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
    >
      {options.map((opt) => {
        const isActive = activeKey === opt.key
        return (
          <button
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "border-primary bg-primary/15 text-primary"
                : "border-cave-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
