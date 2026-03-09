'use client'

import { Home, Map, Wine, UtensilsCrossed, Settings } from 'lucide-react'

export type TabId = 'cave' | 'carte' | 'liste' | 'accords' | 'reglages'

interface BottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'cave', label: 'Cave', icon: Home },
  { id: 'carte', label: 'Carte', icon: Map },
  { id: 'liste', label: 'Liste', icon: Wine },
  { id: 'accords', label: 'Accords', icon: UtensilsCrossed },
  { id: 'reglages', label: 'Reglages', icon: Settings },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-cave-border bg-cave-bg/95 backdrop-blur-md"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
    >
      <div className="mx-auto flex max-w-[480px] items-center justify-around">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
