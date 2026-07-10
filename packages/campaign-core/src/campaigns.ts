export const campaignSlugs = [
  "find-the-fire",
  "the-fire-will-find-you",
] as const;

export type CampaignSlug = (typeof campaignSlugs)[number];

export const campaignInterests = [
  "Hope",
  "Community",
  "Answers",
  "Just Curious",
] as const;

export type CampaignInterest = (typeof campaignInterests)[number];

export interface CampaignHeadingSegment {
  text: string;
  accent?: boolean;
}

export interface CampaignConfig {
  slug: CampaignSlug;
  source: CampaignSlug;
  title: string;
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroCopy: string[];
  formHeading: CampaignHeadingSegment[][];
  formIntro: string;
  eventName: string;
  eventDateLabel: string;
  eventStartDate: string;
  eventEndDate: string;
  eventLocation: string;
  eventWebsite: string;
  organizationName: string;
  contactEmail: string;
  submitLabel: string;
  finePrint: string;
  interests: readonly CampaignInterest[];
  thanksTitle: string;
  thanksBody: string;
  nextLabel: string;
  nextHref: string;
}

const sharedCampaignDetails = {
  eventName: "Reboot Camp North America",
  eventDateLabel: "Sept 4-6, 2026",
  eventStartDate: "2026-09-04",
  eventEndDate: "2026-09-06",
  eventLocation: "Toronto",
  eventWebsite: "https://rebootcampna.org",
  organizationName: "Celebration Church International",
  contactEmail: "canada@joincci.org",
  submitLabel: "Reserve My Spot",
  finePrint:
    "By submitting, you agree to be contacted by Celebration Church International / Reboot Camp about this invitation. We respect your inbox.",
  interests: campaignInterests,
  thanksTitle: "It's Sent.",
  thanksBody:
    "Check your inbox soon. We'll send you exactly what Reboot Camp is, what to expect, and why this weekend may be what you have been looking for.",
  nextLabel: "Learn About Reboot Camp Now",
  nextHref: "https://rebootcampna.org",
} satisfies Partial<CampaignConfig>;

export const campaigns = {
  "find-the-fire": {
    ...sharedCampaignDetails,
    slug: "find-the-fire",
    source: "find-the-fire",
    title: "Find the Fire",
    seoTitle: "Find the Fire | Reboot Camp North America",
    seoDescription:
      "Rediscover your passion for God at Reboot Camp Toronto, September 4-6, 2026. Leave your details to receive event updates.",
    eyebrow: "Reboot Camp North America",
    heroTitle: "Find the Fire",
    heroLead: "You're not alone in this.",
    heroCopy: [
      "Thousands of people quietly long for a deeper relationship with God. Reboot Camp exists to help you rediscover that passion.",
      "Reboot Camp is a three-day gathering where people from across North America come together to pause, pray, worship, learn, and rediscover what matters most.",
      "Whether you've followed Jesus for years or you're simply curious about faith, you'll leave with renewed clarity, stronger community, and practical tools to continue your walk with God.",
    ],
    formHeading: [
      [{ text: "Come Find Out" }],
      [{ text: "What's " }, { text: "Burning", accent: true }],
    ],
    formIntro:
      "Leave your details and we'll send you everything. No spam, just what's coming.",
  },
  "the-fire-will-find-you": {
    ...sharedCampaignDetails,
    slug: "the-fire-will-find-you",
    source: "the-fire-will-find-you",
    title: "The Fire Will Find You",
    seoTitle: "The Fire Will Find You | Reboot Camp North America",
    seoDescription:
      "Maybe this invitation is not an accident. Learn more about Reboot Camp Toronto, September 4-6, 2026.",
    eyebrow: "Reboot Camp North America",
    heroTitle: "The Fire\nWill Find You",
    heroLead: "Maybe this wasn't an accident. You scanned this code for a reason.",
    heroCopy: [
      "What if the longing you can't quite explain is pointing you toward something real?",
      "If there's even a quiet part of you wondering whether God is real, or whether He has been closer than you imagined, perhaps this is your invitation.",
      "Reboot Camp is a three-day experience where people gather to pause, ask honest questions, encounter timeless truth, and explore the person of Jesus through worship, prayer, biblical teaching, and authentic community.",
      "No pressure. No pretending. Just room to seek, reflect, and discover. There's room for you.",
    ],
    formHeading: [
      [{ text: "Join Us for a Weekend" }],
      [{ text: "That Will " }, { text: "Change", accent: true }],
      [{ text: "Your Life" }],
    ],
    formIntro:
      "Leave your details and we'll send you everything. No spam, just what's coming.",
  },
} satisfies Record<CampaignSlug, CampaignConfig>;

export function getCampaign(slug: CampaignSlug): CampaignConfig {
  return campaigns[slug];
}
