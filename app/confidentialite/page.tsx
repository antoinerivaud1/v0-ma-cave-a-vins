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
            Dernière mise à jour : 1 avril 2026
          </p>
          <p className="mt-3 text-foreground">
            <strong className="text-primary">Ma Cave à Vins</strong> est une application
            personnelle de gestion de cave. Votre vie privée est une priorité :
            certaines données sont stockées localement dans votre navigateur, et
            certaines données sont synchronisées dans Supabase lorsque vous utilisez
            un compte. Les usages externes sont limités aux cas décrits ci-dessous.
          </p>
        </section>

        <Divider />

        {/* Données collectées */}
        <section className="space-y-4">
          <SectionTitle>1. Données collectées</SectionTitle>

          <SubSection title="Données stockées localement (sur votre appareil)">
            <p>
              Les informations suivantes peuvent être enregistrées dans le{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">localStorage</code>{" "}
              du navigateur afin d&apos;améliorer la rapidité de l&apos;interface et de
              conserver certains états locaux.
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
              <li>Votre <strong className="text-foreground">prénom</strong> si vous le renseignez.</li>
              <li>Des <strong className="text-foreground">caches et états locaux</strong> : cave active, overrides de stock, enrichissements, dégustations locales et préférences d&apos;interface.</li>
              <li>Des données locales temporaires en attente de synchronisation ou de réinitialisation.</li>
            </ul>
          </SubSection>

          <SubSection title="Données synchronisées dans le cloud">
            <p>
              Lorsque vous êtes connecté, l&apos;application synchronise votre cave avec{" "}
              <strong className="text-foreground">Supabase</strong>. Les données
              suivantes peuvent être stockées à distance pour permettre l&apos;accès
              multi-appareils :
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
              <li>Votre profil de compte et votre plan.</li>
              <li>Vos caves, vos vins et leurs quantités.</li>
              <li>Vos notes de dégustation et métadonnées associées.</li>
            </ul>
          </SubSection>

          <SubSection title="Photos d'étiquettes (scan)">
            <p>
              Lorsque vous utilisez la fonctionnalité <em>Scanner une étiquette</em>,
              la photo est transmise à l'API{" "}
              <strong className="text-foreground">Anthropic Claude Vision</strong> pour
              analyse. La photo est envoyée en base64 via HTTPS. L&apos;application ne
              stocke pas durablement cette image sur son backend. Anthropic peut
              conserver les données
              conformément à{" "}
              <span className="text-primary underline underline-offset-2">
                sa propre politique de confidentialité
              </span>
              .
            </p>
          </SubSection>

          <SubSection title="Enrichissement automatique">
            <p>
              La fonctionnalité d&apos;enrichissement web envoie le nom du vin, le
              millésime et certains champs descriptifs à l&apos;API Anthropic afin
              d&apos;obtenir une description, un prix moyen et une fenêtre d&apos;apogée.
              Aucune donnée personnelle sensible n&apos;est incluse dans cette requête.
            </p>
          </SubSection>
        </section>

        <Divider />

        {/* Compte */}
        <section className="space-y-3">
          <SectionTitle>2. Compte utilisateur et synchronisation</SectionTitle>
          <p className="text-muted-foreground">
            L&apos;application propose un compte utilisateur via Supabase Auth.
            Lorsque vous vous connectez, vos données de cave peuvent être
            synchronisées dans une base Supabase afin de vous permettre de
            retrouver votre cave sur plusieurs appareils.
          </p>
          <p className="text-muted-foreground">
            Si vous ne vous connectez pas, certaines données peuvent rester
            uniquement sur l&apos;appareil local selon le flux utilisé.
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
            Les données synchronisées de compte et de cave sont hébergées par{" "}
            <strong className="text-foreground">Supabase</strong>.
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
            Vous pouvez supprimer l&apos;intégralité des données de cave visibles dans
            l&apos;application à tout moment
            directement depuis l'application :
          </p>
          <div className="rounded-xl border border-cave-border bg-card px-4 py-3 text-muted-foreground">
            <strong className="text-foreground">Réglages</strong>
            {" → "}
            <span className="text-destructive font-medium">Réinitialiser la cave</span>
            <p className="mt-1 text-xs">
              Cette action supprime les données locales de cave et vide les vins et
              dégustations synchronisés associés à votre compte actuel.
            </p>
          </div>
          <p className="text-muted-foreground">
            Vous pouvez également vider le cache de votre navigateur ou désinstaller
            l'application pour effacer les données locales restantes.
          </p>
        </section>

        <Divider />

        {/* Sécurité */}
        <section className="space-y-3">
          <SectionTitle>5. Sécurité</SectionTitle>
          <p className="text-muted-foreground">
            Les communications avec l'API Anthropic sont chiffrées via HTTPS/TLS.
            Les données de compte et de cave synchronisées sont hébergées dans
            Supabase. Les données stockées en localStorage restent soumises à la
            politique de même origine du navigateur.
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
