"use client"

import { useState } from "react"
import type { Provider } from "@supabase/supabase-js"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"

function translateError(message: string): string {
  if (message.includes("Email already registered") || message.includes("already been registered")) {
    return "Cet email est déjà utilisé"
  }
  if (message.includes("Invalid login credentials") || message.includes("invalid_credentials")) {
    return "Email ou mot de passe incorrect"
  }
  if (message.includes("Password should be at least 6 characters") || message.includes("at least 6")) {
    return "Le mot de passe doit faire au moins 6 caractères"
  }
  return message
}

function AppleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 814 1000"
      className="h-4 w-4 shrink-0"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-166.8-113c-51.3-63.8-100.5-163.1-100.5-257.6 0-177.1 115.4-270.9 229.1-270.9 59.3 0 108.9 38.4 147.2 38.4 36.5 0 93.9-40.8 162.4-40.8 13.4 0 88.9 1.3 150.5 57.3zm-154.4-95.7c28.8-34 48.5-81.6 48.5-129.2 0-6.4-.6-12.9-1.9-18.7-44.9 1.9-99.2 30.1-131.5 67.8-25.6 29.4-50 76.3-50 124.2 0 7.1 1.3 14.3 1.9 16.5 3.2.6 8.4 1.3 13.6 1.3 40.2 0 91.1-26.8 119.4-61.9z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  )
}

interface AuthSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthSheet({ open, onOpenChange }: AuthSheetProps) {
  const { signIn, signUp, signInWithOAuth } = useAuth()

  const [tab, setTab] = useState<"login" | "signup">("login")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Connexion fields
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Inscription fields
  const [signupFirstName, setSignupFirstName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")

  function resetError() {
    setError(null)
  }

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    resetError()
    const err = await signIn(loginEmail, loginPassword)
    if (err) {
      setError(translateError(err))
      setIsLoading(false)
    } else {
      setIsLoading(false)
      onOpenChange(false)
    }
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    resetError()
    const err = await signUp(signupEmail, signupPassword, signupFirstName)
    if (err) {
      setError(translateError(err))
      setIsLoading(false)
    } else {
      setIsLoading(false)
      onOpenChange(false)
    }
  }

  async function handleOAuth(provider: Provider) {
    setIsLoading(true)
    resetError()
    await signInWithOAuth(provider)
    setIsLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-0">
        <SheetHeader className="px-6 pt-2 pb-4">
          <SheetTitle className="font-serif text-lg">Mon compte</SheetTitle>
        </SheetHeader>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as "login" | "signup"); resetError() }}>
          <TabsList className="mx-6 mb-4 w-[calc(100%-3rem)]">
            <TabsTrigger value="login" className="flex-1">Connexion</TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">Inscription</TabsTrigger>
          </TabsList>

          {/* Connexion */}
          <TabsContent value="login" className="px-6">
            <form onSubmit={handleSignIn} className="flex flex-col gap-3">
              <Input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
              <Input
                type="password"
                placeholder="Mot de passe"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
              {error && tab === "login" && (
                <p className="text-xs text-destructive">{error}</p>
              )}
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Connexion…
                  </span>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Inscription */}
          <TabsContent value="signup" className="px-6">
            <form onSubmit={handleSignUp} className="flex flex-col gap-3">
              <Input
                type="text"
                placeholder="Prénom"
                value={signupFirstName}
                onChange={(e) => setSignupFirstName(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="given-name"
              />
              <Input
                type="email"
                placeholder="Email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
              <Input
                type="password"
                placeholder="Mot de passe (min. 6 caractères)"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
              />
              {error && tab === "signup" && (
                <p className="text-xs text-destructive">{error}</p>
              )}
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Création…
                  </span>
                ) : (
                  "Créer mon compte"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* OAuth */}
        <div className="px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4">
          <div className="flex items-center gap-3 py-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">ou</span>
            <Separator className="flex-1" />
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={isLoading}
              onClick={() => handleOAuth("apple")}
              type="button"
            >
              <AppleIcon />
              Continuer avec Apple
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={isLoading}
              onClick={() => handleOAuth("google")}
              type="button"
            >
              <GoogleIcon />
              Continuer avec Google
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
