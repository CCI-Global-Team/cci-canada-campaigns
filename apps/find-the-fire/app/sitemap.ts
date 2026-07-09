import { getSiteUrl } from "@cci-campaigns/campaign-core/site";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl("http://localhost:3000");

  return [
    {
      url: siteUrl,
      lastModified: new Date("2026-07-09"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
