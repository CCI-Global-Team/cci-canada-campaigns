import { getCampaign } from "@cci-campaigns/campaign-core/campaigns";
import { createLeadRouteResponse } from "@cci-campaigns/campaign-core/route-handler";
import { getChurchCenterFormUrl } from "@cci-campaigns/campaign-core/site";

export const runtime = "nodejs";

const campaign = getCampaign("the-fire-will-find-you");

export async function POST(request: Request) {
  return createLeadRouteResponse(request, {
    campaign: campaign.slug,
    fallbackHref: getChurchCenterFormUrl(campaign),
  });
}
