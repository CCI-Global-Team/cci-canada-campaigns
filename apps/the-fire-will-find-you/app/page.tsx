import {
  getCampaign,
  type CampaignConfig,
} from "@cci-campaigns/campaign-core/campaigns";
import {
  getChurchCenterFormUrl,
  getSiteUrl,
} from "@cci-campaigns/campaign-core/site";
import { CampaignPage } from "@cci-campaigns/campaign-ui/campaign-page";
import type { Metadata } from "next";
import Image from "next/image";

const campaign = getCampaign("the-fire-will-find-you");
const siteUrl = getSiteUrl("http://localhost:3001");

function createMetadata(config: CampaignConfig): Metadata {
  const imageUrl = `${siteUrl}/images/reboot-fire-hero.png`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      absolute: config.seoTitle,
    },
    description: config.seoDescription,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: config.seoTitle,
      description: config.seoDescription,
      url: siteUrl,
      siteName: config.title,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1536,
          height: 1024,
          alt: `${config.title} Reboot Camp firelight background`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: config.seoTitle,
      description: config.seoDescription,
      images: [imageUrl],
    },
  };
}

export const metadata = createMetadata(campaign);

export default function Home() {
  return (
    <CampaignPage
      campaign={campaign}
      siteUrl={siteUrl}
      churchCenterFormUrl={getChurchCenterFormUrl(campaign)}
      heroBackground={
        <Image
          src="/images/reboot-fire-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      }
    />
  );
}
