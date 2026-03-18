import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politique de confidentialité — Ma Cave à Vins",
}

export default function ConfidentialitePage() {
  return (
    <div
      className="min-h-dvh bg-background text-foreground"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 border-b border-cave-border bg-background/90 px-4 pb-3 backdrop-blur"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
      >
        <Link
          href="/"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card border border-cave-border"
          aria-label="Retour"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <h1 className="font-serif text-lg font-semibold text-foreground">
          Politique de confidentialité
        </h1>
      </header>

      <main className="mx-auto max-w-prose px-5 py-6 space-y-8 text-sm leading-relaxed">

        {/* Intro */}
        <section>
          <p className="text-muted-foreground">
            Dernière mise à jour : mars 2025
          </p>
          <p className="mt-3 text-foreground">
            <strong className="text-primary">Ma Cave à Vins</strong> est une application
            personnelle de gestion de cave. Votre vie privée est une priorité : l'immense
            majorité des données reste sur votre appareil et n'est jamais envoyée à un
            serveur tiers, sauf dans les cas explicitement décrits ci-dessous.
          </p>
        </section>

        <Divider />

        {/* Données collectées */}
        <section className="space-y-4">
          <SectionTitle>1. Données collectées</SectionTitle>

          <SubSection title="Données stockées localement (sur votre appareil)">
            <p>
              Toutes les informations suivantes sont enregistrées exclusivement dans
              le <code className="rounded bg-muted px-1 py-0.5 text-xs">localStorage</code> de
              votre navigateur ou de l'application. Elles ne quittent jamais votre
              appareil sauf cas décrits en section 2.
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
              <li>Votre <strong className="text-foreground">prénom</strong> (facultatif, pour la salutation).</li>
              <li>Votre <strong className="text-foreground">liste de vins</strong> : noms, domaines, millésimes, régions, appellations, quantités et statuts de consommation.</li>
              <li>Les <strong className="text-foreground">préférences d'interface</strong> (thème, etc.).</li>
            </ul>
          </SubSection>

          <SubSection title="Photos d'étiquettes (scan)">
            <p>
              Lorsque vous utilisez la fonctionnalité <em>Scanner une étiquette</em>,
              la photo est transmise à l'API{" "}
              <strong className="text-foreground">Anthropic Claude Vision</strong> pour
              analyse. La photo est envoyée en base64 via HTTPS et{" "}
              <strong className="text-foreground">n'est pas conservée</strong> par
              l'application ni par nos serveurs. Anthropic peut conserver les données
              conformément à{" "}
              <span className="text-primary underline underline-offset-2">
                sa propre politique de confidentialité
              </span>
              .
            </p>
          </SubSection>

          <SubSection title="Enrichissement automatique">
            <p>
              La fonctionnalité d'enrichissement web (à venir) envoie le nom du vin
              à l'API Anthropic afin d'obtenir une description, un prix moyen et une
              fenêtre d'apogée. Aucune donnée personnelle n'est incluse dans cette
              requête.
            </p>
          </SubSection>
        </section>

        <Divider />

        {/* Pas de compte */}
        <section className="space-y-3">
          <SectionTitle>2. Pas de compte utilisateur</SectionTitle>
          <p className="text-muted-foreground">
            L'application ne propose pas de création de compte. Il n'existe aucune
            base de données distante associée à votre profil. Toutes vos données
            restent sur votre appareil tant que vous ne les supprimez pas
            manuellement.
          </p>
        </section>

        <Divider />

        {/* Partage */}
        <section className="space-y-3">
          <SectionTitle>3. Partage avec des tiers</SectionTitle>
          <p className="text-muted-foreground">
            Nous ne vendons ni ne louons vos données à des tiers. Le seul tiers
            susceptible de recevoir des données est{" "}
            <strong className="text-foreground">Anthropic, Inc.</strong> (États-Unis),
            uniquement pour le traitement des images d'étiquettes ou les requêtes
            d'enrichissement, comme décrit en section 1.
          </p>
          <p className="text-muted-foreground">
            Des statistiques d'utilisation anonymisées peuvent être collectées par
            Vercel Analytics (hébergeur de l'application) — sans aucune donnée
            personnelle identifiable.
          </p>
        </section>

        <Divider />

        {/* Droits */}
        <section className="space-y-3">
          <SectionTitle>4. Vos droits — suppression des données</SectionTitle>
          <p className="text-muted-foreground">
            Vous pouvez supprimer l'intégralité de vos données à tout moment
            directement depuis l'application :
          </p>
          <div className="rounded-xl border border-cave-border bg-card px-4 py-3 text-muted-foreground">
            <strong className="text-foreground">Réglages</strong>
            {" → "}
            <span className="text-destructive font-medium">Réinitialiser la cave</span>
            <p className="mt-1 text-xs">
              Cette action vide le localStorage et supprime définitivement toutes
              vos données locales.
            </p>
          </div>
          <p className="text-muted-foreground">
            Vous pouvez également vider le cache de votre navigateur ou désinstaller
            l'application pour effacer toute trace locale.
          </p>
        </section>

        <Divider />

        {/* Sécurité */}
        <section className="space-y-3">
          <SectionTitle>5. Sécurité</SectionTitle>
          <p className="text-muted-foreground">
            Les communications avec l'API Anthropic sont chiffrées via HTTPS/TLS.
            Les données stockées en localStorage sont protégées par la politique de
            même origine du navigateur (same-origin policy).
          </p>
        </section>

        <Divider />

        {/* Mineurs */}
        <section className="space-y-3">
          <SectionTitle>6. Mineurs</SectionTitle>
          <p className="text-muted-foreground">
            Cette application est réservée aux personnes majeures (18 ans et plus)
            conformément à la réglementation sur la vente et la consommation d'alcool.
          </p>
        </section>

        <Divider />

        {/* Contact */}
        <section className="space-y-3">
          <SectionTitle>7. Contact</SectionTitle>
          <p className="text-muted-foreground">
            Pour toute question relative à cette politique ou à vos données :
          </p>
          <a
            href="mailto:antoine.rivaud1@gmail.com"
            className="inline-block rounded-lg border border-cave-border bg-card px-4 py-2.5 text-sm font-medium text-primary"
          >
            antoine.rivaud1@gmail.com
          </a>
        </section>

      </main>
    </div>
  )
}

/* ── Helpers visuels ──────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-base font-semibold text-foreground">{children}</h2>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-cave-border bg-card px-4 py-3 space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">{title}</p>
      <div className="text-muted-foreground">{children}</div>
    </div>
  )
}

function Divider() {
  return <hr className="border-cave-border" />
}
