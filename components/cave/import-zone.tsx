"use client"

import { useCallback, useRef, useState } from "react"
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react"

interface ImportZoneProps {
  onFileSelected: (file: File) => void
  isParsing?: boolean
  compact?: boolean
}

export function ImportZone({ onFileSelected, isParsing = false, compact = false }: ImportZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (ext === "xlsx" || ext === "xls" || ext === "csv") {
        onFileSelected(file)
      }
    },
    [onFileSelected]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  if (compact) {
    return (
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isParsing}
        className="flex items-center gap-2 rounded-lg border border-cave-border bg-secondary px-4 py-3 text-sm text-foreground transition-colors hover:border-primary"
      >
        {isParsing ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <Upload className="h-4 w-4 text-primary" />
        )}
        {isParsing ? "Import en cours..." : "Importer un fichier"}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onChange}
          className="hidden"
        />
      </button>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onDrop={onDrop}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
      }}
      className={`flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed p-8 transition-colors ${
        isDragging
          ? "border-primary bg-primary/10"
          : "border-cave-border hover:border-primary/50"
      }`}
    >
      {isParsing ? (
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
        </div>
      )}
      <div className="text-center">
        <p className="font-serif text-lg text-foreground">
          {isParsing ? "Lecture du fichier..." : "Deposez votre fichier ici"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Formats acceptes : .xlsx, .xls, .csv
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={onChange}
        className="hidden"
        aria-label="Importer un fichier de cave"
      />
    </div>
  )
}
