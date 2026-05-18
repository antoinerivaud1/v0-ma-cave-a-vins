"use client"

import { useState } from "react"
import { ChevronDown, Check } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import type { Wine } from "@/data/apogee"

export interface SortFilterState {
  millesimeSort: "asc" | "desc" | null
  selectedRegions: string[]
  apogeeSort: "asc" | "desc" | null
}

interface SortFilterDropdownProps {
  cave: Wine[]
  state: SortFilterState
  onStateChange: (state: SortFilterState) => void
}

export function SortFilterDropdown({ cave, state, onStateChange }: SortFilterDropdownProps) {
  const [open, setOpen] = useState(false)

  // Get unique regions from cave
  const uniqueRegions = Array.from(new Set(cave.map((w) => String(w.wine_region || ""))))
    .filter(Boolean)
    .sort()

  const activeCount = (state.millesimeSort ? 1 : 0) + state.selectedRegions.length + (state.apogeeSort ? 1 : 0)

  const handleMillesimeClick = (dir: "asc" | "desc") => {
    onStateChange({
      ...state,
      millesimeSort: state.millesimeSort === dir ? null : dir,
    })
  }

  const handleRegionToggle = (region: string) => {
    const updated = state.selectedRegions.includes(region)
      ? state.selectedRegions.filter((r) => r !== region)
      : [...state.selectedRegions, region]
    onStateChange({ ...state, selectedRegions: updated })
  }

  const handleApogeeClick = (dir: "asc" | "desc") => {
    onStateChange({
      ...state,
      apogeeSort: state.apogeeSort === dir ? null : dir,
    })
  }

  const handleReset = () => {
    onStateChange({
      millesimeSort: null,
      selectedRegions: [],
      apogeeSort: null,
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="mx-4 my-2 flex items-center justify-between gap-2 border-cave-border bg-card text-foreground hover:border-primary/30 hover:text-foreground"
        >
          <span>
            Trier par...
            {activeCount > 0 && <span className="ml-2 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">({activeCount})</span>}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 space-y-4 bg-card p-4">
        {/* Millésime Section */}
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Millésime</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={state.millesimeSort === "asc"}
                onCheckedChange={() => handleMillesimeClick("asc")}
              />
              <span className="text-sm text-foreground">Ancien → Récent</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={state.millesimeSort === "desc"}
                onCheckedChange={() => handleMillesimeClick("desc")}
              />
              <span className="text-sm text-foreground">Récent → Ancien</span>
            </label>
          </div>
        </div>

        {/* Région Section */}
        {uniqueRegions.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Région</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uniqueRegions.map((region) => (
                <label key={region} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={state.selectedRegions.includes(region)}
                    onCheckedChange={() => handleRegionToggle(region)}
                  />
                  <span className="text-sm text-foreground">{region}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Apogée Section */}
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Apogée</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={state.apogeeSort === "asc"}
                onCheckedChange={() => handleApogeeClick("asc")}
              />
              <span className="text-sm text-foreground">Urgent en premier</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={state.apogeeSort === "desc"}
                onCheckedChange={() => handleApogeeClick("desc")}
              />
              <span className="text-sm text-foreground">Plus tard en premier</span>
            </label>
          </div>
        </div>

        {/* Reset Button */}
        {activeCount > 0 && (
          <Button
            onClick={handleReset}
            variant="ghost"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            Réinitialiser
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
