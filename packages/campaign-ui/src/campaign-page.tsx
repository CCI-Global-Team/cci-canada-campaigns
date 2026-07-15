import type { CampaignConfig } from "@cci-campaigns/campaign-core/campaigns";
import type { ReactNode } from "react";
import { LeadForm } from "./lead-form";

interface CampaignPageProps {
  campaign: CampaignConfig;
  siteUrl: string;
  churchCenterFormUrl: string;
  heroBackground: ReactNode;
  heroSideVisual?: ReactNode;
  formAction?: string;
}

const emberIndexes = Array.from({ length: 15 }, (_, index) => index + 1);

function renderHeadingLine(
  line: CampaignConfig["formHeading"][number],
  lineIndex: number,
) {
  return (
    <span key={lineIndex} className="block">
      {line.map((segment) => (
        <span
          key={`${lineIndex}-${segment.text}`}
          className={segment.accent ? "campaign-heading-accent" : undefined}
        >
          {segment.text}
        </span>
      ))}
    </span>
  );
}

function getEventJsonLd(campaign: CampaignConfig, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: campaign.eventName,
    description: campaign.seoDescription,
    startDate: campaign.eventStartDate,
    endDate: campaign.eventEndDate,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url: siteUrl,
    location: {
      "@type": "Place",
      name: campaign.eventLocation,
      address: {
        "@type": "PostalAddress",
        addressLocality: campaign.eventLocation,
        addressCountry: "CA",
      },
    },
    organizer: {
      "@type": "Organization",
      name: campaign.organizationName,
      url: campaign.eventWebsite,
      email: campaign.contactEmail,
    },
  };
}

export function CampaignPage({
  campaign,
  siteUrl,
  churchCenterFormUrl,
  heroBackground,
  heroSideVisual,
  formAction,
}: CampaignPageProps) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getEventJsonLd(campaign, siteUrl)),
        }}
      />
      <a className="skip-link" href="#lead-form-section">
        Skip to form
      </a>
      <main className="min-h-screen bg-[color:var(--campaign-ink)] text-[color:var(--campaign-cream)]">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0" aria-hidden="true">
            {heroBackground}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,12,8,0.42),rgba(23,12,8,0.18)_35%,rgba(184,88,21,0.5)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(80%_55%_at_20%_20%,rgba(23,12,8,0.78),transparent_62%),radial-gradient(70%_40%_at_50%_92%,rgba(255,187,85,0.22),transparent_68%)]" />
          </div>

          <section className="relative z-10 min-h-[88svh] overflow-hidden px-6 py-16 sm:px-10 lg:px-[5vw] lg:pb-[8vh]">
            <div
              className="pointer-events-none absolute inset-0 z-0 overflow-hidden motion-reduce:hidden"
              aria-hidden="true"
            >
              {emberIndexes.map((index) => (
                <span key={index} className={`ember ember-${index}`} />
              ))}
            </div>

            <div
              className={`hero-layout ${
                heroSideVisual ? "hero-layout-with-visual" : ""
              }`}
            >
              <div className="hero-copy">
                <p className="mb-5 text-[0.94rem] font-bold uppercase text-[color:var(--campaign-gold)]">
                  {campaign.eyebrow}
                </p>
                <h1
                  className="font-display text-[clamp(3.25rem,11vw,8.75rem)] font-extrabold uppercase leading-[0.86] tracking-[0.01em] text-[color:var(--campaign-cream)] drop-shadow-[0_0_50px_rgba(255,138,51,0.4)]"
                >
                  {campaign.heroTitle.split("\n").map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </h1>
                <p className="mt-7 max-w-2xl font-serif text-[clamp(1.38rem,3vw,1.88rem)] italic leading-[1.4] text-[color:var(--campaign-gold)]">
                  {campaign.heroLead}
                </p>
                <div className="mt-5 max-w-2xl space-y-4 text-[clamp(0.94rem,1.8vw,1.06rem)] leading-[1.65] text-[color:var(--campaign-muted)]">
                  {campaign.heroCopy.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                <a
                  className="campaign-gradient-button mt-10 inline-flex min-h-13 items-center gap-2.5 rounded-full px-8 py-4 font-display text-base font-bold uppercase tracking-[0.05em] text-[color:var(--campaign-ink)]! shadow-[0_8px_30px_rgba(230,50,28,0.34)] outline-none hover:-translate-y-0.5 hover:shadow-[0_12px_38px_rgba(255,138,51,0.44)] focus-visible:ring-2 focus-visible:ring-[color:var(--campaign-gold)]"
                  href="#lead-form-section"
                >
                  Tell Me More
                  <svg
                    aria-hidden="true"
                    className="campaign-gradient-button-icon"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 5v14M19 12l-7 7-7-7" />
                  </svg>
                </a>
              </div>

              {heroSideVisual ? (
                <div className="hero-side-visual" aria-hidden="true">
                  {heroSideVisual}
                </div>
              ) : null}
            </div>
          </section>

          <section
            className="relative z-10 px-6 pb-24 pt-16 sm:px-10 lg:px-[5vw] lg:pb-32"
            id="lead-form-section"
            aria-labelledby="lead-form-heading"
          >
            <div
              className="pointer-events-none absolute inset-0 z-0 overflow-hidden motion-reduce:hidden"
              aria-hidden="true"
            >
              {emberIndexes.map((index) => (
                <span
                  key={index}
                  className={`ember form-ember ember-${index}`}
                />
              ))}
            </div>

            <div className="relative z-10 mx-auto max-w-[680px]">
              <div className="mb-11 text-center">
                <h2
                  className="font-display text-[clamp(2.125rem,5.5vw,3.625rem)] font-extrabold uppercase leading-[0.98] text-[color:var(--campaign-cream)]"
                  id="lead-form-heading"
                >
                  {campaign.formHeading.map(renderHeadingLine)}
                </h2>
                <p className="mt-7 font-display text-[15px] font-bold uppercase tracking-[0.16em] text-[color:var(--campaign-gold)]">
                  {campaign.eventLocation} - {campaign.eventDateLabel}
                </p>
                <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[color:var(--campaign-muted)]">
                  {campaign.formIntro}
                </p>
              </div>

              <LeadForm
                campaignSlug={campaign.slug}
                interests={campaign.interests}
                submitLabel={campaign.submitLabel}
                finePrint={campaign.finePrint}
                thanksTitle={campaign.thanksTitle}
                thanksBody={campaign.thanksBody}
                nextHref={campaign.nextHref}
                nextLabel={campaign.nextLabel}
                fallbackHref={churchCenterFormUrl}
                formAction={formAction}
              />
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-[color:var(--campaign-line)] bg-[color:var(--campaign-footer)] px-6 py-10 text-center text-[color:var(--campaign-soft)] sm:px-10">
        <p className="font-display text-2xl font-black uppercase text-[color:var(--campaign-cream)]">
          {campaign.title}
        </p>
        <p className="mt-3 text-xs leading-5">
          A campaign of {campaign.organizationName}
          <br />
          <a
            className="text-[color:var(--campaign-gold)]! hover:underline"
            href={campaign.eventTrackingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {campaign.eventWebsite.replace(/^https?:\/\//, "")}
          </a>{" "}
          <span aria-hidden="true">.</span>{" "}
          <a
            className="text-[color:var(--campaign-gold)] hover:underline"
            href={`mailto:${campaign.contactEmail}`}
          >
            {campaign.contactEmail}
          </a>
        </p>
        <p className="mt-4 text-xs">
          Copyright 2026 {campaign.organizationName}. All rights reserved.
        </p>
      </footer>
    </>
  );
}
