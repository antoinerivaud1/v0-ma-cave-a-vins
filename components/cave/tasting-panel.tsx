"use client"

import { useState } from "react"
import { Star, Loader2 } from "lucide-react"
import type { Tasting, TastingInput } from "@/hooks/use-tastings"

interface TastingPanelProps {
  tasting: Tasting | null
  isSaving: boolean
  onSave: (input: Pick<TastingInput, "stars" | "comment">) => Promise<void>
  onDelete: () => Promise<void>
}

export function TastingPanel({ tasting, isSaving, onSave, onDelete }: TastingPanelProps) {
  const [editing, setEditing] = useState(!tasting)
  const [stars, setStars] = useState<number>(tasting?.stars ?? 0)
  const [comment, setComment] = useState<string>(tasting?.comment ?? "")
  const [hovered, setHovered] = useState<number>(0)

  // Sync local state when tasting changes from outside
  if (!editing && tasting && tasting.stars !== stars && stars === 0) {
    setStars(tasting.stars)
    setComment(tasting.comment)
  }

  const handleSave = async () => {
    if (stars === 0) return
    await onSave({ stars, comment })
    setEditing(false)
  }

  const handleDelete = async () => {
    await onDelete()
    setStars(0)
    setComment("")
    setEditing(true)
  }

  const handleEdit = () => {
    if (tasting) {
      setStars(tasting.stars)
      setComment(tasting.comment)
    }
    setEditing(true)
  }

  if (!editing && tasting) {
    return (
      <div className="mb-3 flex flex-col gap-2 rounded-lg border border-cave-border bg-amber-950/10 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-500">
              Mon avis
            </span>
          </div>
          <button
            onClick={handleEdit}
            className="text-[10px] text-muted-foreground underline underline-offset-2"
          >
            Modifier
          </button>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i <= tasting.stars
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground"
              }`}
            />
          ))}
        </div>
        {tasting.comment && (
          <p className="text-xs leading-relaxed text-foreground italic">
            {tasting.comment}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="mb-3 flex flex-col gap-3 rounded-lg border border-cave-border bg-amber-950/10 px-3 py-3">
      <div className="flex items-center gap-1.5">
        <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-500">
          Mon avis
        </span>
      </div>

      {/* Étoiles interactives */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setStars(i)}
            className="p-0.5 touch-manipulation"
            aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                i <= (hovered || stars)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Commentaire */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Notes de dégustation, impressions..."
        rows={3}
        className="w-full resize-none rounded-md border border-cave-border bg-background px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={stars === 0 || isSaving}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            "Sauvegarder"
          )}
        </button>
        {tasting && (
          <button
            onClick={() => {
              setStars(tasting.stars)
              setComment(tasting.comment)
              setEditing(false)
            }}
            className="rounded-md border border-cave-border px-3 py-1.5 text-xs text-muted-foreground"
          >
            Annuler
          </button>
        )}
        {tasting && (
          <button
            onClick={handleDelete}
            disabled={isSaving}
            className="rounded-md border border-destructive px-3 py-1.5 text-xs text-destructive disabled:opacity-40"
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  )
}
