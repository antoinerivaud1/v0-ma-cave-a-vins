'use client'

import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface FindWineOnlineProps {
  wineName?: string
  millesime?: number
}

export function FindWineOnline({ wineName = '', millesime }: FindWineOnlineProps) {
  const [isOpen, setIsOpen] = useState(false)

  // URL encode the search parameters
  const encodedWineName = encodeURIComponent(wineName)
  const encodedMillesime = millesime ? encodeURIComponent(String(millesime)) : ''
  const searchQuery = encodedMillesime ? `${encodedWineName}+${encodedMillesime}` : encodedWineName

  const searchLinks = [
    {
      name: 'Vivino',
      url: `https://www.vivino.com/search/wines?q=${searchQuery}`,
    },
    {
      name: 'Wine-Searcher',
      url: `https://www.wine-searcher.com/find/${searchQuery}`,
    },
    {
      name: 'Google Shopping',
      url: `https://www.google.com/search?q=${searchQuery}+acheter&tbm=shop`,
    },
    {
      name: 'Idealwine',
      url: `https://www.idealwine.com/fr/recherche/?search=${searchQuery}`,
    },
  ]

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-cave-border bg-secondary/50 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        aria-label="Find this wine online"
      >
        <ExternalLink className="h-4 w-4" />
        Trouver ce vin en ligne
      </button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle className="text-center text-base">
              {wineName && millesime ? (
                <span>
                  {wineName} <span className="text-muted-foreground">{millesime}</span>
                </span>
              ) : (
                'Rechercher en ligne'
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-3">
            {searchLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-cave-border bg-card p-3 transition-colors hover:bg-secondary"
              >
                <span className="font-medium text-foreground">{link.name}</span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-sm font-medium">Rechercher</span>
                  <ExternalLink className="h-4 w-4" />
                </div>
              </a>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
