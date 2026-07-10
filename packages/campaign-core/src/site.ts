import type { CampaignConfig } from "./campaigns";

export function getSiteUrl(fallback: string) {
  // TODO(launch): Replace localhost fallbacks with the final campaign domains and keep NEXT_PUBLIC_SITE_URL set in Vercel.
  const value = process.env.NEXT_PUBLIC_SITE_URL ?? fallback;
  return value.replace(/\/$/, "");
}

export function getChurchCenterFormUrl(campaign: CampaignConfig) {
  return process.env.NEXT_PUBLIC_CHURCH_CENTER_FORM_URL ?? campaign.nextHref;
}
