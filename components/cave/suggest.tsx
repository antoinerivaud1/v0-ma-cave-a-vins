'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Search, UtensilsCrossed, Loader2 } from 'lucide-react'
import { PageHeader } from './page-header'
import { SuggestionCard } from './suggestion-card'
import { suggestService, type SuggestResponse } from '@/lib/suggest-service'
import type { Wine } from '@/data/apogee'

interface SuggestProps {
  cave: Wine[]
}

export function Suggest({ cave }: SuggestProps) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<SuggestResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /** Cleanup recognition on unmount */
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
        setError('Decrivez un repas ou un plat pour obtenir un accord.')
        setResult(null)
        return
      }

      if (cave.length === 0) {
        setError('Votre cave est vide. Importez des vins pour commencer.')
        setResult(null)
        return
      }

      setLoading(true)
      try {
        const response = await suggestService.getSuggestions(trimmed, cave)
        setResult(response)
      } catch {
        setError('Une erreur est survenue. Veuillez reessayer.')
        setResult(null)
      } finally {
        setLoading(false)
      }
    },
    [cave]
  )

  const handleSearch = useCallback(() => {
    runSearch(query)
  }, [query, runSearch])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSearch()
      }
    },
    [handleSearch]
  )

  const startVoice = useCallback(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null

    if (!SpeechRecognitionAPI) {
      alert('La reconnaissance vocale necessite Chrome ou un navigateur compatible.')
      return
    }

    if (recording && recognitionRef.current) {
      recognitionRef.current.stop()
      setRecording(false)
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'fr-FR'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript || ''
      setQuery(transcript)
      setRecording(false)
      // Auto-search after voice input
      setTimeout(() => {
        const trimmed = transcript.trim()
        if (trimmed && cave.length > 0) {
          runSearch(trimmed)
        }
      }, 100)
    }

    recognition.onerror = () => {
      setRecording(false)
    }

    recognition.onend = () => {
      setRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }, [recording, cave, runSearch])

  return (
    <div className="pb-4">
      <PageHeader title="Accords" subtitle="Mets & vins" />

      {/* Search bar */}
      <div className="mt-4 flex flex-col gap-3 px-4">
        <div className="flex items-center gap-2">
          <div
            className={`flex flex-1 items-center gap-2 rounded-xl border bg-card px-3 py-2.5 transition-colors ${
              recording
                ? 'animate-pulse border-destructive'
                : 'border-cave-border focus-within:border-primary/50'
            }`}
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex : poulet roti, saumon..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              aria-label="Decrivez un repas"
              disabled={loading}
            />
            <button
              onClick={startVoice}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                recording
                  ? 'bg-destructive/20 text-destructive'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={recording ? 'Arreter la dictee' : 'Dicter un plat'}
              disabled={loading}
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UtensilsCrossed className="h-4 w-4" />
          )}
          {loading ? 'Recherche...' : 'Accorder'}
        </button>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="mx-4 mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mx-4 mt-8 flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Recherche des meilleurs accords...</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="mt-6 flex flex-col gap-4 px-4">
          <p className="text-sm text-muted-foreground">
            {'Accord pour : '}
            <span className="font-medium text-foreground">{`\u00AB ${query.trim()} \u00BB`}</span>
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
            <div className="rounded-xl border border-cave-border bg-card p-5 text-center">
              <p className="font-serif text-base text-foreground">Aucune correspondance</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Aucun vin de votre cave ne correspond a ce type d{"'"}accord.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !error && !loading && (
        <div className="mx-4 mt-10 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-serif text-lg font-semibold text-foreground">
              Quel est le menu ?
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Decrivez un plat ou une occasion et nous vous suggererons les meilleurs vins de votre cave.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
