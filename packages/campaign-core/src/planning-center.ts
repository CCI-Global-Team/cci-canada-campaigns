import { z } from "zod";
import type { CampaignInterest } from "./campaigns";
import type { LeadSubmission } from "./lead-schema";

const planningCenterApiVersion = "2026-06-04";

const planningCenterConfigSchema = z.strictObject({
  formId: z.string().min(1),
  clientId: z.string().min(1),
  secret: z.string().min(1),
  userAgent: z.string().min(1),
  fieldIds: z.strictObject({
    phone: z.string().min(1),
    city: z.string().min(1),
    interests: z.string().min(1),
  }),
  interestOptionIds: z.partialRecord(
    z.enum(["Hope", "Community", "Answers", "Just Curious"]),
    z.string().min(1),
  ),
});

type PlanningCenterConfig = z.infer<typeof planningCenterConfigSchema>;

type Env = Record<string, string | undefined>;
type SubmissionMode = "live" | "mock";

interface PlanningCenterValue {
  formFieldId: string;
  value: string;
}

interface PlanningCenterSubmissionResult {
  mode: SubmissionMode;
}

interface PlanningCenterSubmissionLogInput {
  endpoint: string;
  payload: ReturnType<typeof buildPlanningCenterPayload>;
  response: Response;
  responseBody: unknown;
}

export class MissingPlanningCenterConfigError extends Error {
  constructor() {
    super("Planning Center is not configured for this site yet.");
    this.name = "MissingPlanningCenterConfigError";
  }
}

export class PlanningCenterSubmissionError extends Error {
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(status: number, retryAfterSeconds?: number) {
    super("Planning Center rejected the submission.");
    this.name = "PlanningCenterSubmissionError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function isEnabled(value: string | undefined) {
  return ["1", "true", "yes", "on"].includes(value?.toLowerCase() ?? "");
}

export function shouldUsePlanningCenterMock(env: Env = process.env) {
  return isEnabled(env.PLANNING_CENTER_USE_MOCK_SUBMISSIONS);
}

export function shouldLogPlanningCenterSubmissions(env: Env = process.env) {
  return isEnabled(env.PLANNING_CENTER_LOG_SUBMISSIONS);
}

function getMockPlanningCenterConfig(env: Env = process.env): PlanningCenterConfig {
  return {
    formId: env.PLANNING_CENTER_FORM_ID || "mock-reboot-camp-form",
    clientId: "mock-client-id",
    secret: "mock-secret",
    userAgent: env.PLANNING_CENTER_USER_AGENT || "CCI Campaigns Local Mock",
    fieldIds: {
      phone: "mock-field-phone",
      city: "mock-field-city",
      interests: "mock-field-interests",
    },
    interestOptionIds: {
      Hope: "mock-option-hope",
      Community: "mock-option-community",
      Answers: "mock-option-answers",
      "Just Curious": "mock-option-just-curious",
    },
  };
}

function getPlanningCenterConfig(env: Env = process.env): PlanningCenterConfig {
  const parsed = planningCenterConfigSchema.safeParse({
    formId: env.PLANNING_CENTER_FORM_ID,
    clientId: env.PLANNING_CENTER_CLIENT_ID,
    secret: env.PLANNING_CENTER_SECRET,
    userAgent: env.PLANNING_CENTER_USER_AGENT,
    fieldIds: {
      phone: env.PLANNING_CENTER_FIELD_PHONE_ID,
      city: env.PLANNING_CENTER_FIELD_CITY_ID,
      interests: env.PLANNING_CENTER_FIELD_INTERESTS_ID,
    },
    interestOptionIds: {
      Hope: env.PLANNING_CENTER_INTEREST_HOPE_OPTION_ID,
      Community: env.PLANNING_CENTER_INTEREST_COMMUNITY_OPTION_ID,
      Answers: env.PLANNING_CENTER_INTEREST_ANSWERS_OPTION_ID,
      "Just Curious": env.PLANNING_CENTER_INTEREST_JUST_CURIOUS_OPTION_ID,
    },
  });

  if (!parsed.success) {
    throw new MissingPlanningCenterConfigError();
  }

  return parsed.data;
}

function getInterestValue(
  interest: CampaignInterest,
  config: PlanningCenterConfig,
) {
  const optionIds: Partial<Record<CampaignInterest, string>> =
    config.interestOptionIds;

  return optionIds[interest] ?? interest;
}

function getRetryAfterSeconds(value: string | null) {
  if (!value) {
    return undefined;
  }

  const seconds = Number.parseInt(value, 10);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds;
  }

  const retryDate = Date.parse(value);

  if (Number.isNaN(retryDate)) {
    return undefined;
  }

  return Math.max(0, Math.ceil((retryDate - Date.now()) / 1000));
}

function parsePlanningCenterResponseBody(value: string) {
  if (!value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function getPlanningCenterResponseHeaders(response: Response) {
  const headerNames = [
    "content-type",
    "retry-after",
    "x-pco-api-version",
    "x-request-id",
  ];
  const headers: Record<string, string> = {};

  for (const name of headerNames) {
    const value = response.headers.get(name);

    if (value) {
      headers[name] = value;
    }
  }

  return headers;
}

function logPlanningCenterSubmission({
  endpoint,
  payload,
  response,
  responseBody,
}: PlanningCenterSubmissionLogInput) {
  console.info(
    "[cci-campaigns] Planning Center live submission",
    JSON.stringify(
      {
        request: {
          method: "POST",
          endpoint,
          apiVersion: planningCenterApiVersion,
          payload,
        },
        response: {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: getPlanningCenterResponseHeaders(response),
          body: responseBody,
        },
      },
      null,
      2,
    ),
  );
}

export function buildPlanningCenterPayload(
  lead: LeadSubmission,
  config: PlanningCenterConfig,
) {
  const values: PlanningCenterValue[] = [
    { formFieldId: config.fieldIds.city, value: lead.city },
  ];

  if (lead.phone) {
    values.push({ formFieldId: config.fieldIds.phone, value: lead.phone });
  }

  for (const interest of lead.interests) {
    values.push({
      formFieldId: config.fieldIds.interests,
      value: getInterestValue(interest, config),
    });
  }

  return {
    data: {
      type: "FormSubmission",
      attributes: {
        person_attributes: {
          first_name: lead.firstName,
          last_name: lead.lastName,
          emails_attributes: [
            {
              location: "Home",
              address: lead.email,
            },
          ],
        },
      },
    },
    included: values.map(({ formFieldId, value }) => ({
      type: "FormSubmissionValue",
      attributes: {
        form_field_id: formFieldId,
        value,
      },
    })),
  };
}

export async function submitLeadToPlanningCenter(
  lead: LeadSubmission,
  env: Env = process.env,
): Promise<PlanningCenterSubmissionResult> {
  if (shouldUsePlanningCenterMock(env)) {
    const payload = buildPlanningCenterPayload(
      lead,
      getMockPlanningCenterConfig(env),
    );

    console.info(
      "[cci-campaigns] Mock Planning Center submission",
      JSON.stringify(
        {
          mode: "mock",
          lead,
          payload,
        },
        null,
        2,
      ),
    );

    return { mode: "mock" };
  }

  const config = getPlanningCenterConfig(env);
  const credentials = Buffer.from(
    `${config.clientId}:${config.secret}`,
  ).toString("base64");
  const payload = buildPlanningCenterPayload(lead, config);
  const endpoint = `https://api.planningcenteronline.com/people/v2/forms/${config.formId}/form_submissions`;
  const response = await fetch(
    endpoint,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
        "User-Agent": config.userAgent,
        "X-PCO-API-Version": planningCenterApiVersion,
      },
      body: JSON.stringify(payload),
    },
  );
  const responseBody = parsePlanningCenterResponseBody(await response.text());

  if (shouldLogPlanningCenterSubmissions(env)) {
    logPlanningCenterSubmission({
      endpoint,
      payload,
      response,
      responseBody,
    });
  }

  if (!response.ok) {
    throw new PlanningCenterSubmissionError(
      response.status,
      getRetryAfterSeconds(response.headers.get("Retry-After")),
    );
  }

  return { mode: "live" };
}
