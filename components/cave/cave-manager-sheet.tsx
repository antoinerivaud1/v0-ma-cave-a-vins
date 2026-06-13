"use client"

import { useState } from "react"
import { Check, MoreHorizontal, Pencil, Trash2, Plus, AlertTriangle } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"
import { useCaves } from "@/hooks/use-caves"
import type { Cave } from "@/hooks/use-caves"
import { PremiumBadge } from "./coming-soon-badge"

const CAVE_LIMIT_SOFT = 5

interface CaveManagerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CaveManagerSheet({ open, onOpenChange }: CaveManagerSheetProps) {
  const { user, isPremium } = useAuth()
  const { caves, activeCaveId, createCave, renameCave, deleteCave, setActiveCave } = useCaves()

  const isPremiumGated = !isPremium && caves.length >= 1

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [deletingCave, setDeletingCave] = useState<Cave | null>(null)
  const [showNewInput, setShowNewInput] = useState(false)
  const [newCaveName, setNewCaveName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleStartRename = (cave: Cave) => {
    setRenamingId(cave.id)
    setRenameValue(cave.name)
  }

  const handleConfirmRename = async (id: string) => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== caves.find((c) => c.id === id)?.name) {
      await renameCave(id, trimmed)
    }
    setRenamingId(null)
  }

  const handleSetActive = async (id: string) => {
    await setActiveCave(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingCave) return
    await deleteCave(deletingCave.id)
    setDeletingCave(null)
  }

  const handleCreateCave = async () => {
    const trimmed = newCaveName.trim()
    if (!trimmed) return
    setIsCreating(true)
    await createCave(trimmed)
    setNewCaveName("")
    setShowNewInput(false)
    setIsCreating(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-0 max-h-[90dvh] flex flex-col z-[60]">
          <SheetHeader
            className="px-5 pb-3"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
          >
            <SheetTitle className="font-serif text-lg">Mes caves</SheetTitle>
          </SheetHeader>

          <Separator />

          {!user ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              Connectez-vous pour gérer plusieurs caves
            </div>
          ) : (
            <>
              {/* Cave list */}
              <div className="max-h-[55vh] overflow-y-auto">
                {caves.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Aucune cave trouvée
                  </div>
                ) : (
                  <ul className="divide-y divide-ink">
                    {caves.map((cave) => {
                      const isActive = cave.id === activeCaveId
                      const isRenaming = renamingId === cave.id

                      return (
                        <li key={cave.id} className="flex items-center gap-3 px-5 py-3">
                          {/* Active dot */}
                          <span
                            className={`h-2.5 w-2.5 shrink-0 rounded-full transition-colors ${
                              isActive ? "bg-rouge" : "bg-transparent border border-muted-foreground/30"
                            }`}
                            aria-label={isActive ? "Cave active" : ""}
                          />

                          {/* Name or inline rename input */}
                          {isRenaming ? (
                            <div className="flex flex-1 items-center gap-2">
                              <Input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleConfirmRename(cave.id)
                                  if (e.key === "Escape") setRenamingId(null)
                                }}
                                className="h-8 flex-1 text-sm"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="default"
                                className="h-8 px-3 text-xs"
                                onClick={() => handleConfirmRename(cave.id)}
                              >
                                OK
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-3 text-xs"
                                onClick={() => setRenamingId(null)}
                              >
                                Annuler
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="flex-1 text-sm font-medium text-foreground">
                                {cave.name}
                              </span>

                              {isActive && (
                                <span className="mr-1 text-xs text-rouge">Active</span>
                              )}

                              {/* 3-dot menu */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  {!isActive && (
                                    <DropdownMenuItem
                                      onClick={() => handleSetActive(cave.id)}
                                      className="gap-2"
                                    >
                                      <Check className="h-4 w-4" />
                                      Définir comme active
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleStartRename(cave)}
                                    className="gap-2"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Renommer
                                  </DropdownMenuItem>
                                  {!isActive && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => setDeletingCave(cave)}
                                        variant="destructive"
                                        className="gap-2"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}

                {/* Soft limit warning */}
                {caves.length > CAVE_LIMIT_SOFT && (
                  <div className="mx-5 my-3 flex items-start gap-2 rounded-lg border border-amber-800/30 bg-amber-950/20 px-3 py-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <p className="text-xs text-amber-300">
                      Vous avez plus de {CAVE_LIMIT_SOFT} caves. Pensez à consolider votre collection.
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Footer — new cave */}
              <div
                className="px-5 py-4"
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
              >
                {isPremiumGated ? (
                  <div className="flex items-center gap-3 rounded-xl border border-rouge/20 bg-rouge/10 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">Nouvelle cave</span>
                        <PremiumBadge />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Gérez plusieurs caves avec un abonnement Premium
                      </p>
                    </div>
                    <Button size="sm" disabled className="shrink-0 gap-1.5 opacity-50">
                      <Plus className="h-4 w-4" />
                      Créer
                    </Button>
                  </div>
                ) : showNewInput ? (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Nom de la cave"
                      value={newCaveName}
                      onChange={(e) => setNewCaveName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateCave()
                        if (e.key === "Escape") {
                          setShowNewInput(false)
                          setNewCaveName("")
                        }
                      }}
                      className="h-9 flex-1 text-sm"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleCreateCave}
                      disabled={isCreating || !newCaveName.trim()}
                      className="h-9 px-4"
                    >
                      Créer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 px-3"
                      onClick={() => {
                        setShowNewInput(false)
                        setNewCaveName("")
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowNewInput(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Nouvelle cave
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingCave} onOpenChange={(o) => !o && setDeletingCave(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette cave ?</AlertDialogTitle>
            <AlertDialogDescription>
              La cave <strong>{deletingCave?.name}</strong> sera supprimée. Les vins qu&apos;elle
              contient ne seront pas perdus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
