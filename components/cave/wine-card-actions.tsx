'use client'

import { useState } from 'react'
import { MoreVertical, Trash2, Archive, Edit, Wine } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export interface WineCardActionsProps {
  wineName: string
  millesime: string | number
  currentQuantity: number
  isArchived?: boolean
  onConsume: () => void
  onQuantityChange: (qty: number) => void
  onArchive: () => void
  onRestore?: () => void
  onDelete: () => void
  onEditClick?: () => void
}

export function WineCardActions({
  wineName,
  millesime,
  currentQuantity,
  isArchived = false,
  onConsume,
  onQuantityChange,
  onArchive,
  onRestore,
  onDelete,
  onEditClick,
}: WineCardActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isEditingQuantity, setIsEditingQuantity] = useState(false)
  const [tempQuantity, setTempQuantity] = useState(String(currentQuantity))

  const handleQuantitySave = () => {
    const qty = Math.max(0, parseInt(tempQuantity) || 0)
    onQuantityChange(qty)
    setIsEditingQuantity(false)
  }

  return (
    <>
      {/* Quantity edit UI */}
      {isEditingQuantity && (
        <div className="flex items-center gap-1.5 px-3.5 py-2 border-t border-cave-border bg-card/50">
          <input
            type="number"
            min="0"
            value={tempQuantity}
            onChange={(e) => setTempQuantity(e.target.value)}
            className="h-8 w-16 rounded border border-primary bg-background px-2 text-sm text-foreground"
            autoFocus
          />
          <button
            onClick={handleQuantitySave}
            className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
          >
            OK
          </button>
          <button
            onClick={() => setIsEditingQuantity(false)}
            className="px-2 py-1 rounded bg-muted text-foreground text-xs hover:bg-muted/80"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Dropdown menu trigger */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {!isArchived ? (
            <>
              <DropdownMenuItem onClick={onConsume} className="gap-2">
                <Wine className="h-4 w-4" />
                Consommée
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsEditingQuantity(true)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Modifier la quantité
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive} className="gap-2">
                <Archive className="h-4 w-4" />
                Archiver
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={onRestore} className="gap-2">
                <Archive className="h-4 w-4" />
                Restaurer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce vin ?</AlertDialogTitle>
            <AlertDialogDescription>
              {wineName} {millesime} sera supprime definitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete()
                setShowDeleteDialog(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
