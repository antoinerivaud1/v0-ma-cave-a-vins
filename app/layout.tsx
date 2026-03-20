import type { Metadata, Viewport } from "next"
import { Inter, Cormorant_Garamond } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { AuthProvider } from "@/components/providers/auth-provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
})

export const metadata: Metadata = {
  title: "Ma Cave à Vins",
  description: "Votre sommelier personnel — gérez votre cave à vins",
  generator: "v0.app",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ma Cave",
    startupImage: "/splash.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#1a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // layout.tsx is read-only — cookie refreshes are handled by middleware
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="fr">
      <body className={`${inter.variable} ${cormorant.variable} font-sans antialiased`}>
        <AuthProvider initialUser={user}>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
