"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Mic, Search, UtensilsCrossed, Loader2 } from "lucide-react"
import { PageHeader } from "./page-header"
import { SuggestionCard } from "./suggestion-card"
import { suggestService, type SuggestResponse } from "@/lib/suggest-service"
import type { Wine } from "@/data/apogee"
import { useStockOverrides } from "@/hooks/use-stock-overrides"
import { getEffectiveWineState } from "@/lib/stock-overrides"

interface SuggestProps {
  cave: Wine[]
}

export function Suggest({ cave }: SuggestProps) {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<SuggestResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)

  const recognitionRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { getOverrideForWine } = useStockOverrides()
  const availableWines = cave.filter((wine) => getEffectiveWineState(wine, getOverrideForWine(wine)).isVisible)

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  const runSearch = useCallback(
    async (text: string) => {
      setError(null)
      const trimmed = text.trim()
      if (!trimmed) {
        setError("Decrivez un repas ou un plat pour obtenir un accord.")
        setResult(null)
        return
      }
      if (availableWines.length === 0) {
        setError("Votre cave est vide. Importez des vins pour commencer.")
        setResult(null)
        return
      }
      setLoading(true)
      try {
        const response = await suggestService.getSuggestions(trimmed, availableWines)
        setResult(response)
      } catch {
        setError("Une erreur est survenue. Veuillez reessayer.")
        setResult(null)
      } finally {
        setLoading(false)
      }
    },
    [availableWines]
  )

  const handleSearch = useCallback(() => { runSearch(query) }, [query, runSearch])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); handleSearch() }
    },
    [handleSearch]
  )

  const startVoice = useCallback(() => {
    const SpeechRecognitionAPI =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null
    if (!SpeechRecognitionAPI) {
      alert("La reconnaissance vocale necessite Chrome ou un navigateur compatible.")
      return
    }
    if (recording && recognitionRef.current) {
      recognitionRef.current.stop()
      setRecording(false)
      return
    }
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = "fr-FR"
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript || ""
      setQuery(transcript)
      setRecording(false)
      setTimeout(() => {
        const trimmed = transcript.trim()
        if (trimmed && availableWines.length > 0) runSearch(trimmed)
      }, 100)
    }
    recognition.onerror = () => { setRecording(false) }
    recognition.onend = () => { setRecording(false) }
    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }, [recording, availableWines.length, runSearch])

  return (
    <div className="pb-4">
      <PageHeader title="Accords" subtitle="Mets & vins" />

      {/* Search bar */}
      <div className="mt-4 flex flex-col gap-3 px-4">
        <div className="flex items-center gap-2">
          <div
            className={`flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 transition-colors ${
              recording
                ? "animate-pulse border-2 border-destructive bg-[var(--bg)]"
                : "border-2 border-ink bg-[var(--bg)] focus-within:border-rouge"
            }`}
            style={{ boxShadow: "2px 2px 0 var(--border-hard)" }}
          >
            <Search className="h-4 w-4 shrink-0 text-ink-soft" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex : poulet roti, saumon..."
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-soft focus:outline-none"
              aria-label="Decrivez un repas"
              disabled={loading}
            />
            <button
              onClick={startVoice}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                recording ? "bg-destructive/20 text-destructive" : "text-ink-soft hover:text-ink"
              }`}
              aria-label={recording ? "Arreter la dictee" : "Dicter un plat"}
              disabled={loading}
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
          style={{
            background: "var(--rouge)",
            color: "var(--rouge-fg)",
            border: "2px solid var(--border-hard)",
            boxShadow: "2px 2px 0 var(--shadow-hard)",
          }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UtensilsCrossed className="h-4 w-4" />}
          {loading ? "Recherche..." : "Accorder"}
        </button>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div
          className="mx-4 mt-4 rounded-xl border-2 border-ink bg-paper-2 px-4 py-3"
          style={{ boxShadow: "2px 2px 0 var(--shadow-hard)" }}
        >
          <p className="text-sm text-ink">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mx-4 mt-8 flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-rouge" />
          <p className="text-sm text-ink-soft">Recherche des meilleurs accords...</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="mt-6 flex flex-col gap-4 px-4">
          <p className="text-sm text-ink-soft">
            {"Accord pour : "}
            <span className="font-medium text-ink">{"« " + query.trim() + " »"}</span>
          </p>
          {result.results.length > 0 ? (
            result.results.map((sr, i) => (
              <SuggestionCard
                key={`${sr.wine.wine_name}-${sr.wine.millesime_year}-${i}`}
                wine={sr.wine}
                reason={sr.reason}
                temperature={sr.temperature}
                serving={sr.serving}
                aiGenerated={sr.aiGenerated}
              />
            ))
          ) : (
            <div
              className="rounded-xl border-2 border-ink bg-paper-2 p-5 text-center"
              style={{ boxShadow: "2px 2px 0 var(--shadow-hard)" }}
            >
              <p className="font-serif italic text-base text-ink">Aucune correspondance</p>
              <p className="mt-1 text-sm text-ink-soft">
                Aucun vin de votre cave ne correspond a ce type d{"'"}accord.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !error && !loading && (
        <div
          className="mx-4 mt-10 rounded-xl border-2 border-ink bg-paper-2 p-6"
          style={{ boxShadow: "2px 2px 0 var(--shadow-hard)" }}
        >
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ink-soft">
            Accord mets & vins
          </p>
          <p className="font-serif italic text-2xl text-ink leading-tight">
            Quel est le menu ?
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Decrivez un plat ou une occasion et nous vous suggererons les meilleurs vins de votre cave.
          </p>
          <div
            className="mt-4 flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: "var(--rouge)", color: "var(--rouge-fg)" }}
          >
            <UtensilsCrossed className="h-5 w-5" />
          </div>
        </div>
      )}
    </div>
  )
}
