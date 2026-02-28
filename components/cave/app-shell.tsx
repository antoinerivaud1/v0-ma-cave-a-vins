'use client'

import { useState } from 'react'
import { BottomNav, type TabId } from './bottom-nav'
import { Dashboard } from './dashboard'
import { CaveList } from './cave-list'
import { MapView } from './map-view'
import { Suggest } from './suggest'
import { Settings } from './settings'
import type { Wine } from '@/data/apogee'

interface AppShellProps {
  cave: Wine[]
  lastUpdated: string | null
  onImport: (data: Wine[]) => void
  onClear: () => void
}

export function AppShell({ cave, lastUpdated, onImport, onClear }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<TabId>('cave')

  return (
    <div className="mx-auto min-h-dvh max-w-[480px]" style={{ paddingBottom: 'calc(76px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Active Screen */}
      {activeTab === 'cave' && <Dashboard cave={cave} onNavigate={setActiveTab} />}
      {activeTab === 'carte' && <MapView cave={cave} />}
      {activeTab === 'liste' && <CaveList cave={cave} />}
      {activeTab === 'accords' && <Suggest cave={cave} />}
      {activeTab === 'reglages' && (
        <Settings
          cave={cave}
          lastUpdated={lastUpdated}
          onImport={onImport}
          onClear={onClear}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
