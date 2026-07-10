import type { CampaignSlug } from "./campaigns";
import {
  getLeadFieldErrors,
  isLikelySpam,
  parseLeadSubmission,
  type LeadSubmission,
} from "./lead-schema";
import {
  MissingPlanningCenterConfigError,
  PlanningCenterSubmissionError,
  submitLeadToPlanningCenter,
} from "./planning-center";

interface LeadRouteOptions {
  campaign: CampaignSlug;
  fallbackHref: string;
}

function jsonResponse(
  body: unknown,
  status: number,
  headers?: HeadersInit,
) {
  return Response.json(body, { headers, status });
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function ensureCampaign(lead: LeadSubmission, campaign: CampaignSlug) {
  return lead.campaign === campaign;
}

export async function createLeadRouteResponse(
  request: Request,
  { campaign, fallbackHref }: LeadRouteOptions,
) {
  // TODO(launch): Add Vercel free-tier rate limiting/firewall protection for /api/leads before live submissions.
  const input = await readJson(request);
  const parsed = parseLeadSubmission(input);

  if (!parsed.success) {
    return jsonResponse(
      {
        message: "Please fix the field messages above.",
        fieldErrors: getLeadFieldErrors(parsed.error),
      },
      400,
    );
  }

  if (!ensureCampaign(parsed.data, campaign)) {
    return jsonResponse(
      {
        message: "This campaign form is not available from this site.",
      },
      400,
    );
  }

  if (isLikelySpam(parsed.data)) {
    // Silently drop honeypot submissions so bots get no useful feedback.
    return jsonResponse({ message: "Thanks. Your details were sent." }, 200);
  }

  try {
    const submission = await submitLeadToPlanningCenter(parsed.data);
    return jsonResponse(
      {
        message:
          submission.mode === "mock"
            ? "Mock submission captured."
            : "Thanks. Your details were sent.",
        mode: submission.mode,
      },
      200,
    );
  } catch (error) {
    if (error instanceof MissingPlanningCenterConfigError) {
      return jsonResponse(
        {
          message:
            "Online submission is not configured yet. Please use the Church Center form link.",
          fallbackHref,
        },
        503,
      );
    }

    if (error instanceof PlanningCenterSubmissionError) {
      if (error.status === 429) {
        const retryAfter = error.retryAfterSeconds;
        const retryMessage =
          typeof retryAfter === "number" && retryAfter > 0
            ? `We are receiving a lot of submissions right now. Please wait ${retryAfter} seconds and try again, or use the Church Center form link.`
            : "We are receiving a lot of submissions right now. Please try again in a moment or use the Church Center form link.";

        return jsonResponse(
          {
            message: retryMessage,
            fallbackHref,
            retryAfterSeconds: retryAfter,
          },
          429,
          retryAfter ? { "Retry-After": String(retryAfter) } : undefined,
        );
      }

      return jsonResponse(
        {
          message:
            "We could not send your details right now. Please try again or use the Church Center form link.",
          fallbackHref,
        },
        502,
      );
    }

    return jsonResponse(
      {
        message:
          "Something went wrong. Please try again or use the Church Center form link.",
        fallbackHref,
      },
      500,
    );
  }
}
