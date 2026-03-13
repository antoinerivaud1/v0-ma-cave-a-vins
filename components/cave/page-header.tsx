"use client"

interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="px-4 pb-2" style={{ paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))" }}>
      <h1 className="font-serif text-2xl font-semibold text-foreground">{title}</h1>
      {subtitle && (
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </header>
  )
}
